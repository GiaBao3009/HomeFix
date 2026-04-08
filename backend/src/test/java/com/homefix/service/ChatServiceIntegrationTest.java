package com.homefix.service;

import com.homefix.common.BookingStatus;
import com.homefix.common.Role;
import com.homefix.dto.ChatAttachmentDto;
import com.homefix.dto.ConversationMessageDto;
import com.homefix.dto.ConversationPageDto;
import com.homefix.dto.ConversationSummaryDto;
import com.homefix.dto.CreateConversationRequest;
import com.homefix.dto.SendConversationMessageRequest;
import com.homefix.dto.SimpleUserChatDto;
import com.homefix.entity.Booking;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.ServicePackage;
import com.homefix.entity.User;
import com.homefix.repository.BookingRepository;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.ServicePackageRepository;
import com.homefix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ChatServiceIntegrationTest {
    @Autowired
    private ChatService chatService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ServiceCategoryRepository categoryRepository;

    @Autowired
    private ServicePackageRepository packageRepository;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private JavaMailSender javaMailSender;

    private User customer;
    private User technician;
    private User admin;

    @BeforeEach
    void setUp() {
        customer = saveUser("customer-chat@homefix.com", "Khách chat", Role.CUSTOMER);
        technician = saveUser("tech-chat@homefix.com", "Thợ chat", Role.TECHNICIAN);
        admin = saveUser("admin-chat@homefix.com", "Admin chat", Role.ADMIN);
    }

    @Test
    void createConversation_andExchangeMessages_shouldWork() {
        authenticate(customer.getEmail());
        CreateConversationRequest request = new CreateConversationRequest();
        request.setTitle("Hỗ trợ khách hàng");
        request.setParticipantIds(List.of(technician.getId(), admin.getId()));

        ConversationSummaryDto conversation = chatService.createConversation(request);
        assertThat(conversation.getParticipants()).hasSize(3);

        SendConversationMessageRequest firstMessage = new SendConversationMessageRequest();
        firstMessage.setConversationId(conversation.getId());
        firstMessage.setContent("Xin chào @tech");
        firstMessage.setMentionedUserIds(List.of(technician.getId()));
        ConversationMessageDto created = chatService.sendMessage(firstMessage);

        authenticate(technician.getEmail());
        SendConversationMessageRequest reply = new SendConversationMessageRequest();
        reply.setConversationId(conversation.getId());
        reply.setContent("Mình đã nhận được");
        reply.setParentMessageId(created.getId());
        reply.setAttachments(List.of(buildAttachment(
                "evidence.png",
                "http://localhost:8080/api/files/download/evidence.png",
                "image/png",
                1024
        )));
        ConversationMessageDto replied = chatService.sendMessage(reply);

        assertThat(replied.getParentMessageId()).isEqualTo(created.getId());
        assertThat(replied.getAttachments()).hasSize(1);

        ConversationPageDto page = chatService.getMessages(conversation.getId(), 0, 20);
        assertThat(page.getItems()).hasSize(2);
        assertThat(page.getItems().get(1).getId()).isEqualTo(replied.getId());
    }

    @Test
    void unreadCounts_shouldDecreaseAfterMarkRead() {
        authenticate(customer.getEmail());
        CreateConversationRequest request = new CreateConversationRequest();
        request.setTitle("Unread test");
        request.setParticipantIds(List.of(technician.getId()));
        ConversationSummaryDto conversation = chatService.createConversation(request);

        SendConversationMessageRequest firstMessage = new SendConversationMessageRequest();
        firstMessage.setConversationId(conversation.getId());
        firstMessage.setContent("Tin nhắn mới");
        chatService.sendMessage(firstMessage);

        authenticate(technician.getEmail());
        ConversationSummaryDto technicianView = chatService.getMyConversations().stream()
                .filter(item -> item.getId().equals(conversation.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(technicianView.getUnreadCount()).isEqualTo(1);

        chatService.markConversationRead(conversation.getId());
        ConversationSummaryDto afterRead = chatService.getMyConversations().stream()
                .filter(item -> item.getId().equals(conversation.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(afterRead.getUnreadCount()).isZero();
    }

    @Test
    void searchMessages_shouldOnlyReturnVisibleMessages() {
        authenticate(customer.getEmail());
        CreateConversationRequest request = new CreateConversationRequest();
        request.setTitle("Search room");
        request.setParticipantIds(List.of(technician.getId()));
        ConversationSummaryDto conversation = chatService.createConversation(request);

        SendConversationMessageRequest messageRequest = new SendConversationMessageRequest();
        messageRequest.setConversationId(conversation.getId());
        messageRequest.setContent("Máy lạnh đang chảy nước");
        chatService.sendMessage(messageRequest);

        authenticate(technician.getEmail());
        ConversationPageDto searchResult = chatService.searchMessages("chảy nước", 0, 20);
        assertThat(searchResult.getItems())
                .extracting(ConversationMessageDto::getConversationId)
                .contains(conversation.getId());
    }

    @Test
    void mentionOutsideConversation_shouldBeRejected() {
        authenticate(customer.getEmail());
        CreateConversationRequest request = new CreateConversationRequest();
        request.setTitle("Mention invalid");
        request.setParticipantIds(List.of(technician.getId()));
        ConversationSummaryDto conversation = chatService.createConversation(request);

        SendConversationMessageRequest messageRequest = new SendConversationMessageRequest();
        messageRequest.setConversationId(conversation.getId());
        messageRequest.setContent("Không hợp lệ");
        messageRequest.setMentionedUserIds(List.of(admin.getId()));

        assertThatThrownBy(() -> chatService.sendMessage(messageRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Mention không hợp lệ");
    }

    @Test
    void getSuggestedUsers_forCustomer_shouldReturnAssignedTechnicians() {
        ServicePackage servicePackage = saveServicePackage("Vệ sinh máy lạnh");
        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setTechnician(technician);
        booking.setServicePackage(servicePackage);
        booking.setBookingTime(LocalDateTime.now().plusDays(1));
        booking.setAddress("123 Nguyễn Trãi");
        booking.setStatus(BookingStatus.ASSIGNED);
        booking.setTotalPrice(BigDecimal.valueOf(300_000));
        bookingRepository.save(booking);

        authenticate(customer.getEmail());
        List<SimpleUserChatDto> suggestions = chatService.getSuggestedUsers();

        assertThat(suggestions).extracting(SimpleUserChatDto::getId).contains(technician.getId());
        assertThat(suggestions).extracting(SimpleUserChatDto::getHint)
                .anyMatch(hint -> hint != null && hint.contains("đơn #"));
    }

    @Test
    void getSuggestedUsers_forTechnician_shouldReturnCustomer() {
        ServicePackage servicePackage = saveServicePackage("Sửa điện nước");
        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setTechnician(technician);
        booking.setServicePackage(servicePackage);
        booking.setBookingTime(LocalDateTime.now().plusDays(1));
        booking.setAddress("456 Cầu Giấy");
        booking.setStatus(BookingStatus.IN_PROGRESS);
        booking.setTotalPrice(BigDecimal.valueOf(450_000));
        bookingRepository.save(booking);

        authenticate(technician.getEmail());
        List<SimpleUserChatDto> suggestions = chatService.getSuggestedUsers();

        assertThat(suggestions).extracting(SimpleUserChatDto::getId).contains(customer.getId());
        assertThat(suggestions).extracting(SimpleUserChatDto::getHint)
                .anyMatch(hint -> hint != null && hint.contains("Khách"));
    }

    private User saveUser(String email, String fullName, Role role) {
        User user = new User();
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPassword("secret");
        user.setRole(role);
        return userRepository.save(user);
    }

    private ChatAttachmentDto buildAttachment(String fileName, String fileUrl, String contentType, long sizeBytes) {
        ChatAttachmentDto attachment = new ChatAttachmentDto();
        attachment.setFileName(fileName);
        attachment.setFileUrl(fileUrl);
        attachment.setContentType(contentType);
        attachment.setSizeBytes(sizeBytes);
        return attachment;
    }

    private ServicePackage saveServicePackage(String name) {
        ServiceCategory category = new ServiceCategory();
        category.setName("Chat Test Category " + name);
        category.setDescription("Category for chat test");
        category = categoryRepository.save(category);

        ServicePackage servicePackage = new ServicePackage();
        servicePackage.setName(name);
        servicePackage.setDescription("Service for chat test");
        servicePackage.setPrice(BigDecimal.valueOf(150_000));
        servicePackage.setCategory(category);
        return packageRepository.save(servicePackage);
    }

    private void authenticate(String email) {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(email, null, List.of()));
    }
}
