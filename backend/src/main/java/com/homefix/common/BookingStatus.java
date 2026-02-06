package com.homefix.common;

public enum BookingStatus {
    PENDING, // Chờ xác nhận
    CONFIRMED, // Đã xác nhận (chưa có thợ)
    ASSIGNED, // Đã phân công (chờ thợ xác nhận)
    IN_PROGRESS, // Đang thực hiện (thợ đã nhận)
    COMPLETED, // Hoàn thành
    CANCELLED, // Hủy bỏ
    DECLINED // Thợ từ chối
}
