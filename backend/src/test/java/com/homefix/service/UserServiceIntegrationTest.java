package com.homefix.service;

import com.homefix.common.Role;
import com.homefix.common.TechnicianApprovalStatus;
import com.homefix.common.TechnicianType;
import com.homefix.dto.UserDto;
import com.homefix.entity.ServiceCategory;
import com.homefix.entity.User;
import com.homefix.repository.ServiceCategoryRepository;
import com.homefix.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserServiceIntegrationTest {
    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ServiceCategoryRepository serviceCategoryRepository;
    @MockBean
    private JavaMailSender javaMailSender;

    private User technician;
    private User mainSupervisor;
    private ServiceCategory category;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        serviceCategoryRepository.deleteAll();

        category = new ServiceCategory();
        category.setName("Air Conditioner");
        category.setDescription("AC services");
        category = serviceCategoryRepository.save(category);

        mainSupervisor = new User();
        mainSupervisor.setFullName("Main Supervisor");
        mainSupervisor.setEmail("main-supervisor@test.com");
        mainSupervisor.setPassword("x");
        mainSupervisor.setRole(Role.TECHNICIAN);
        mainSupervisor.setTechnicianProfileCompleted(true);
        mainSupervisor.setTechnicianType(TechnicianType.MAIN);
        mainSupervisor.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        mainSupervisor = userRepository.save(mainSupervisor);

        technician = new User();
        technician.setFullName("Tech One");
        technician.setEmail("tech-update@test.com");
        technician.setPassword("x");
        technician.setRole(Role.TECHNICIAN);
        technician.setTechnicianApprovalStatus(TechnicianApprovalStatus.NOT_REQUIRED);
        technician = userRepository.save(technician);
    }

    @Test
    void updateTechnicianProfile_shouldPersistAssistantSupervisorCategoriesAndAvailability() {
        UserDto updateDto = new UserDto();
        updateDto.setSpecialty("AC Repair");
        updateDto.setExperienceYears(5);
        updateDto.setWorkDescription("Maintenance and repair");
        updateDto.setCitizenId("123456789012");
        updateDto.setTechnicianType("ASSISTANT");
        updateDto.setSupervisingTechnicianId(mainSupervisor.getId());
        updateDto.setCategoryIds(List.of(category.getId()));
        updateDto.setBaseLocation("Cau Giay, Ha Noi");
        updateDto.setAvailableFrom(LocalTime.of(8, 0));
        updateDto.setAvailableTo(LocalTime.of(18, 0));
        updateDto.setAvailableForAutoAssign(true);

        UserDto result = userService.updateTechnicianProfile(technician.getEmail(), updateDto);

        User saved = userRepository.findByEmail(technician.getEmail()).orElseThrow();
        assertThat(result.isTechnicianProfileCompleted()).isTrue();
        assertThat(result.getCategoryIds()).containsExactly(category.getId());
        assertThat(result.getSupervisingTechnicianId()).isEqualTo(mainSupervisor.getId());
        assertThat(result.getAssistantPromoteAt()).isAfter(result.getAssistantStartedAt());
        assertThat(saved.isTechnicianProfileCompleted()).isTrue();
        assertThat(saved.getCategories()).extracting(ServiceCategory::getId).containsExactly(category.getId());
        assertThat(saved.getAvailableFrom()).isEqualTo(LocalTime.of(8, 0));
        assertThat(saved.getAvailableTo()).isEqualTo(LocalTime.of(18, 0));
        assertThat(saved.getSupervisingTechnician().getId()).isEqualTo(mainSupervisor.getId());
    }

    @Test
    void promoteEligibleAssistants_shouldUpgradeTechnicianAfterOneMonth() {
        technician.setTechnicianProfileCompleted(true);
        technician.setTechnicianType(TechnicianType.ASSISTANT);
        technician.setTechnicianApprovalStatus(TechnicianApprovalStatus.APPROVED);
        technician.setSupervisingTechnician(mainSupervisor);
        technician.setAssistantStartedAt(LocalDateTime.now().minusMonths(1).minusDays(1));
        technician.setAssistantPromoteAt(LocalDateTime.now().minusDays(1));
        userRepository.save(technician);

        userService.promoteEligibleAssistants();

        User saved = userRepository.findByEmail(technician.getEmail()).orElseThrow();
        assertThat(saved.getTechnicianType()).isEqualTo(TechnicianType.MAIN);
        assertThat(saved.getTechnicianApprovalStatus()).isEqualTo(TechnicianApprovalStatus.APPROVED);
        assertThat(saved.getSupervisingTechnician()).isNull();
        assertThat(saved.getAssistantPromoteAt()).isNull();
    }
}
