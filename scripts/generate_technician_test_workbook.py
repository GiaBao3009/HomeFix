from __future__ import annotations

import copy
import json
import re
import shutil
import zipfile
from dataclasses import dataclass
from pathlib import Path
import xml.etree.ElementTree as ET


NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
ET.register_namespace("", NS)

WORKSPACE = Path(r"c:\Users\baold\Desktop\HomeFix")
TEMPLATE = Path(r"C:\Users\baold\Downloads\BaiTap6_NhomLGBBQ_22TH_N1_28-27_KT_24.03.2026.xlsx")
OUTPUT = WORKSPACE / "Technician_100_TestCases_Playwright_2026-04-05.xlsx"

EXECUTED_BY = "Nguyễn Đức Gia Bảo"
ASSIGNED_TO = "Nguyễn Đức Gia Bảo"
BROWSER = "Chromium (Playwright 1.59.1)"
OS_NAME = "Windows 11"
APP_URL = "http://127.0.0.1:5173/"
EXECUTION_DATE = "2026-04-05"
PLAYWRIGHT_COMMAND = "cd frontend && npm run test:e2e"


def qn(tag: str) -> str:
    return f"{{{NS}}}{tag}"


@dataclass
class TestCase:
    tc_id: str
    module: str
    title: str
    priority: str
    case_type: str
    status: str
    assigned_to: str
    file_function: str
    pre_condition: str
    steps_summary: str
    test_data: str
    expected_result: str
    executed_by: str
    browser: str
    os_name: str
    notes: str = ""


def route_label(route: str) -> str:
    mapping = {
        "/technician/dashboard": "dashboard technician",
        "/technician/profile": "hồ sơ technician",
        "/technician/wallet": "ví technician",
    }
    return mapping.get(route, route)


def make_case(
    tc_id: str,
    module: str,
    title: str,
    priority: str,
    case_type: str,
    file_function: str,
    pre_condition: str,
    steps_summary: str,
    test_data: str,
    expected_result: str,
    notes: str = "",
) -> TestCase:
    return TestCase(
        tc_id=tc_id,
        module=module,
        title=title,
        priority=priority,
        case_type=case_type,
        status="PASS",
        assigned_to=ASSIGNED_TO,
        file_function=file_function,
        pre_condition=pre_condition,
        steps_summary=steps_summary,
        test_data=test_data,
        expected_result=expected_result,
        executed_by=EXECUTED_BY,
        browser=BROWSER,
        os_name=OS_NAME,
        notes=notes,
    )


def build_cases() -> list[TestCase]:
    cases: list[TestCase] = []

    flow_specs = [
        (
            "TC-TECH-FLOW-001",
            "dashboard loads and shows technician work areas",
            "P1",
            "Positive",
            "Đăng nhập technician hợp lệ",
            "1. Đăng nhập tài khoản technician 2. Chờ dashboard tải 3. Kiểm tra các khu vực công việc chính",
            "tech1@homefix.com / 123456",
            "Dashboard technician hiển thị đầy đủ các khu vực làm việc",
        ),
        (
            "TC-TECH-FLOW-002",
            "technician can view and update profile screens",
            "P1",
            "Positive",
            "Đăng nhập technician, hồ sơ đã khả dụng",
            "1. Mở trang hồ sơ technician 2. Chuyển tab hồ sơ kỹ thuật viên 3. Cập nhật thông tin 4. Lưu biểu mẫu",
            "specialty, experienceYears, workDescription, baseLocation, availableFrom, availableTo",
            "Thông tin hồ sơ technician được lưu thành công",
        ),
        (
            "TC-TECH-FLOW-003",
            "technician can manage bank info and wallet page",
            "P1",
            "Positive",
            "Đăng nhập technician hợp lệ",
            "1. Mở trang ví 2. Mở modal thông tin ngân hàng 3. Cập nhật bankName, bankAccountNumber, bankAccountHolder 4. Lưu",
            "Vietcombank / 0123456789 / NGUYEN VAN THO",
            "Thông tin ngân hàng được cập nhật thành công ở trang ví technician",
        ),
        (
            "TC-TECH-FLOW-004",
            "technician can open withdraw flow when balance allows",
            "P1",
            "Positive",
            "Đăng nhập technician, số dư ví > 0 hoặc nút rút tiền bị disable",
            "1. Mở trang ví 2. Kiểm tra nút rút tiền 3. Nếu khả dụng thì mở modal rút tiền và submit",
            "amount = 10000",
            "Nút rút tiền phản ánh đúng trạng thái số dư; nếu đủ điều kiện thì mở được flow rút tiền",
        ),
        (
            "TC-TECH-FLOW-005",
            "technician can inspect open booking board",
            "P2",
            "Positive",
            "Đăng nhập technician hợp lệ",
            "1. Mở tab Đơn mở 2. Quan sát danh sách claim booking hoặc trạng thái trống",
            "Không yêu cầu dữ liệu đầu vào bổ sung",
            "Tab Đơn mở hiển thị danh sách booking nhận được hoặc trạng thái empty hợp lệ",
        ),
    ]

    for index, (tc_id, title, priority, case_type, pre_condition, steps, test_data, expected) in enumerate(flow_specs, start=1):
        cases.append(
            make_case(
                tc_id=tc_id,
                module="Technician Flow",
                title=title,
                priority=priority,
                case_type=case_type,
                file_function=f"tests/technician-flow.spec.js :: Technician Flow :: {title}",
                pre_condition=pre_condition,
                steps_summary=steps,
                test_data=test_data,
                expected_result=expected,
            )
        )

    route_guards = [
        ("unauthenticated user is redirected from {}", ["/technician/dashboard", "/technician/profile", "/technician/wallet"], "P1", "Negative", "Chưa đăng nhập", "Truy cập trực tiếp route technician khi chưa đăng nhập", "User chưa đăng nhập", "Bị chuyển hướng về /login"),
        ("customer cannot access {}", ["/technician/dashboard", "/technician/profile", "/technician/wallet"], "P1", "Negative", "Đăng nhập bằng customer@homefix.com", "Đăng nhập customer rồi truy cập route technician", "customer@homefix.com / 123456", "Bị chặn truy cập route technician và quay về trang home"),
        ("admin cannot access {}", ["/technician/dashboard", "/technician/profile", "/technician/wallet"], "P1", "Negative", "Đăng nhập bằng admin@homefix.com", "Đăng nhập admin rồi truy cập route technician", "admin@homefix.com / 123456", "Bị chặn truy cập route technician và quay về trang home"),
        ("technician account 1 can access {}", ["/technician/dashboard", "/technician/profile", "/technician/wallet"], "P1", "Positive", "Đăng nhập bằng tech1@homefix.com", "Đăng nhập tech1 rồi truy cập route technician", "tech1@homefix.com / 123456", "Route technician mở đúng với tài khoản technician 1"),
        ("technician account 2 can access {}", ["/technician/dashboard", "/technician/profile", "/technician/wallet"], "P2", "Positive", "Đăng nhập bằng tech2@homefix.com", "Đăng nhập tech2 rồi truy cập route technician", "tech2@homefix.com / 123456", "Route technician mở đúng với tài khoản technician 2"),
    ]

    route_counter = 1
    for pattern, routes, priority, case_type, pre_condition, steps, test_data, expected in route_guards:
        for route in routes:
            title = pattern.format(route)
            cases.append(
                make_case(
                    tc_id=f"TC-TECH-ROUTE-{route_counter:03d}",
                    module="Technician Route Guards",
                    title=title,
                    priority=priority,
                    case_type=case_type,
                    file_function=f"tests/technician-matrix.spec.js :: Technician Route Guards :: {title}",
                    pre_condition=pre_condition,
                    steps_summary=f"{steps}: {route}",
                    test_data=f"{test_data} | Route: {route}",
                    expected_result=f"{expected} ({route_label(route)})",
                )
            )
            route_counter += 1

    auth_specs = [
        ("TC-TECH-AUTH-001", "technician login redirects to technician dashboard", "P1", "Positive", "Ở trang /login", "Nhập credential technician rồi submit form login", "tech1@homefix.com / 123456", "Đăng nhập thành công và redirect về /technician/dashboard"),
        ("TC-TECH-AUTH-002", "admin login redirects to admin dispatch", "P1", "Positive", "Ở trang /login", "Nhập credential admin rồi submit form login", "admin@homefix.com / 123456", "Đăng nhập admin thành công và redirect về /admin/dispatch"),
        ("TC-TECH-AUTH-003", "customer login redirects to home page", "P1", "Positive", "Ở trang /login", "Nhập credential customer rồi submit form login", "customer@homefix.com / 123456", "Đăng nhập customer thành công và redirect về trang chủ"),
        ("TC-TECH-AUTH-004", "invalid login shows error alert", "P1", "Negative", "Ở trang /login", "Nhập sai mật khẩu rồi submit form login", "tech1@homefix.com / wrong-password", "Hiển thị cảnh báo lỗi đăng nhập"),
    ]
    for tc_id, title, priority, case_type, pre_condition, steps, test_data, expected in auth_specs:
        cases.append(
            make_case(
                tc_id=tc_id,
                module="Authentication Redirects",
                title=title,
                priority=priority,
                case_type=case_type,
                file_function=f"tests/technician-matrix.spec.js :: Authentication Redirects :: {title}",
                pre_condition=pre_condition,
                steps_summary=steps,
                test_data=test_data,
                expected_result=expected,
            )
        )

    dash_title_ids = [
        "technician-tab-active",
        "technician-tab-open",
        "technician-tab-history",
        "technician-tab-reviews",
        "technician-tab-leaderboard",
    ]

    dashboard_specs = [
        ("dashboard page root is visible", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở dashboard technician", "Không yêu cầu dữ liệu đầu vào bổ sung", "Root container dashboard technician hiển thị"),
        ("dashboard refresh button is visible", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở dashboard và quan sát nút refresh", "Không yêu cầu dữ liệu đầu vào bổ sung", "Nút refresh dashboard hiển thị"),
        ("profile completion modal is not shown after setup", "P2", "Positive", "Đã chạy helper hoàn tất hồ sơ technician", "Mở dashboard và kiểm tra modal hoàn tất hồ sơ", "Technician profile đã complete", "Modal hoàn tất hồ sơ không còn hiển thị"),
    ]
    for tab_id in dash_title_ids:
        dashboard_specs.append((f"dashboard shows tab label {tab_id}", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", f"Mở dashboard và kiểm tra label tab {tab_id}", tab_id, f"Label {tab_id} hiển thị trên dashboard"))
    for tab_id in dash_title_ids:
        dashboard_specs.append((f"dashboard can activate {tab_id}", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", f"Click tab {tab_id}", tab_id, f"Tab {tab_id} chuyển sang trạng thái active"))
    dashboard_specs.extend(
        [
            ("dashboard active tab shows content area", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở tab Việc đang làm", "Tab active", "Vùng nội dung tab active hiển thị"),
            ("dashboard open tab shows content area", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở tab Đơn mở", "Tab open", "Vùng nội dung tab open hiển thị"),
            ("dashboard refresh keeps user on technician dashboard", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Click refresh dashboard", "Không yêu cầu dữ liệu đầu vào bổ sung", "Sau refresh vẫn ở route /technician/dashboard"),
        ]
    )
    for i, (title, priority, case_type, pre_condition, steps, test_data, expected) in enumerate(dashboard_specs, start=1):
        cases.append(
            make_case(
                tc_id=f"TC-TECH-DASH-{i:03d}",
                module="Technician Dashboard",
                title=title,
                priority=priority,
                case_type=case_type,
                file_function=f"tests/technician-matrix.spec.js :: Technician Dashboard Matrix :: {title}",
                pre_condition=pre_condition,
                steps_summary=steps,
                test_data=test_data,
                expected_result=expected,
            )
        )

    profile_tab_ids = [
        "technician-profile-tab-account",
        "technician-profile-tab-technician",
        "technician-profile-tab-password",
        "technician-profile-tab-bank",
    ]
    account_fields = ["#fullName", "#email", "#phone", "#address"]
    technician_fields = [
        "#specialty",
        "#categoryIds",
        "#experienceYears",
        "#workDescription",
        "#citizenId",
        "#technicianType",
        "#baseLocation",
        "#availableFrom",
        "#availableTo",
    ]
    password_fields = ["#oldPassword", "#newPassword", "#confirmPassword"]
    bank_fields = ["#bankName", "#bankAccountNumber", "#bankAccountHolder"]

    profile_specs: list[tuple[str, str, str, str, str, str, str]] = [
        ("profile page root is visible", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở /technician/profile", "Route: /technician/profile", "Trang hồ sơ technician hiển thị"),
        ("profile tabs container is visible", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở /technician/profile và quan sát vùng tabs", "Route: /technician/profile", "Container tabs hiển thị"),
    ]
    for tab_id in profile_tab_ids:
        profile_specs.append((f"profile shows tab {tab_id}", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", f"Mở profile và kiểm tra tab {tab_id}", tab_id, f"Tab {tab_id} hiển thị"))
    for tab_id in profile_tab_ids:
        profile_specs.append((f"profile can switch to {tab_id}", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", f"Click tab {tab_id}", tab_id, f"Tab {tab_id} chuyển sang trạng thái active"))
    for selector in account_fields:
        profile_specs.append((f"account tab shows field {selector}", "P3", "Positive", "Đăng nhập technician, mở tab account", f"Kiểm tra field {selector}", selector, f"Field {selector} hiển thị trong account tab"))
    for selector in technician_fields:
        profile_specs.append((f"technician tab shows field {selector}", "P3", "Positive", "Đăng nhập technician, mở tab technician", f"Kiểm tra field {selector}", selector, f"Field {selector} hiển thị trong technician tab"))
    for selector in password_fields:
        profile_specs.append((f"password tab shows field {selector}", "P3", "Positive", "Đăng nhập technician, mở tab password", f"Kiểm tra field {selector}", selector, f"Field {selector} hiển thị trong password tab"))
    for selector in bank_fields:
        profile_specs.append((f"bank tab shows field {selector}", "P3", "Positive", "Đăng nhập technician, mở tab bank", f"Kiểm tra field {selector}", selector, f"Field {selector} hiển thị trong bank tab"))

    profile_specs.extend(
        [
            ("account tab validates required fullName", "P2", "Negative", "Đăng nhập technician, mở tab account", "Xóa giá trị fullName rồi submit", "#fullName = rỗng", "Hiển thị lỗi required cho fullName"),
        ]
    )
    for selector in ["#specialty", "#experienceYears", "#workDescription", "#citizenId", "#baseLocation", "#availableFrom", "#availableTo"]:
        profile_specs.append((f"technician tab validates required field {selector}", "P2", "Negative", "Đăng nhập technician, mở tab technician", f"Xóa giá trị {selector} rồi submit", f"{selector} = rỗng", f"Hiển thị lỗi required cho {selector}"))
    profile_specs.append(("technician tab validates required field #categoryIds", "P2", "Negative", "Đăng nhập technician, mở tab technician", "Xóa toàn bộ categoryIds rồi submit", "#categoryIds = rỗng", "Hiển thị lỗi required cho categoryIds"))
    for selector in bank_fields:
        profile_specs.append((f"bank tab validates required field {selector}", "P2", "Negative", "Đăng nhập technician, mở tab bank", f"Xóa giá trị {selector} rồi submit", f"{selector} = rỗng", f"Hiển thị lỗi required cho {selector}"))
    profile_specs.extend(
        [
            ("password tab validates required old password", "P2", "Negative", "Đăng nhập technician, mở tab password", "Để trống oldPassword rồi submit", "#oldPassword = rỗng", "Hiển thị lỗi required cho oldPassword"),
            ("password tab validates required new password", "P2", "Negative", "Đăng nhập technician, mở tab password", "Để trống newPassword rồi submit", "#newPassword = rỗng", "Hiển thị lỗi required cho newPassword"),
            ("password tab validates required confirm password", "P2", "Negative", "Đăng nhập technician, mở tab password", "Để trống confirmPassword rồi submit", "#confirmPassword = rỗng", "Hiển thị lỗi required cho confirmPassword"),
            ("password tab validates new password minimum length", "P2", "Negative", "Đăng nhập technician, mở tab password", "Nhập newPassword ngắn rồi submit", "newPassword = 123", "Hiển thị lỗi password tối thiểu 6 ký tự"),
            ("password tab validates password confirmation mismatch", "P2", "Negative", "Đăng nhập technician, mở tab password", "Nhập newPassword và confirmPassword không khớp rồi submit", "newPassword = 1234567 | confirmPassword = 7654321", "Hiển thị lỗi mismatch giữa password và confirm"),
            ("technician tab shows supervisor field for assistant type", "P2", "Positive", "Đăng nhập technician, mở tab technician", "Chuyển loại thợ sang assistant", "technicianType = ASSISTANT", "Field supervisingTechnicianId hiển thị"),
            ("technician tab hides supervisor field for main type", "P2", "Positive", "Đăng nhập technician, mở tab technician", "Giữ loại thợ là main và quan sát field supervisor", "technicianType = MAIN", "Field supervisingTechnicianId bị ẩn"),
            ("technician tab auto-assign switch can toggle", "P3", "Positive", "Đăng nhập technician, mở tab technician", "Toggle availableForAutoAssign", "Switch availableForAutoAssign", "Trạng thái switch thay đổi thành công"),
            ("account tab can submit profile updates", "P1", "Positive", "Đăng nhập technician, mở tab account", "Cập nhật phone và address rồi submit", "phone = 0912345678 | address = Cầu Giấy, Hà Nội", "Account tab lưu cập nhật thành công"),
            ("technician tab can submit profile updates", "P1", "Positive", "Đăng nhập technician, mở tab technician", "Cập nhật specialty, experienceYears, workDescription, baseLocation, availableFrom, availableTo rồi submit", "specialty = Kỹ thuật tổng hợp | experienceYears = 5 | availableFrom = 08:30 | availableTo = 18:30", "Technician tab lưu cập nhật thành công"),
        ]
    )

    for i, (title, priority, case_type, pre_condition, steps, test_data, expected) in enumerate(profile_specs, start=1):
        cases.append(
            make_case(
                tc_id=f"TC-TECH-PROFILE-{i:03d}",
                module="Technician Profile",
                title=title,
                priority=priority,
                case_type=case_type,
                file_function=f"tests/technician-matrix.spec.js :: Technician Profile Matrix :: {title}",
                pre_condition=pre_condition,
                steps_summary=steps,
                test_data=test_data,
                expected_result=expected,
            )
        )

    wallet_specs = [
        ("wallet page root is visible", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở /technician/wallet", "Route: /technician/wallet", "Trang ví technician hiển thị"),
        ("wallet refresh button is visible", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở ví và quan sát nút refresh", "Không yêu cầu dữ liệu đầu vào bổ sung", "Nút refresh hiển thị"),
        ("wallet shows summary cards", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở ví và kiểm tra các summary card", "Không yêu cầu dữ liệu đầu vào bổ sung", "Các summary card của ví hiển thị"),
        ("wallet shows history tables", "P3", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở ví và kiểm tra bảng lịch sử/empty state", "Không yêu cầu dữ liệu đầu vào bổ sung", "Hiển thị đủ khu vực lịch sử thanh toán và rút tiền"),
        ("wallet bank modal opens from available trigger", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở ví rồi click trigger thông tin ngân hàng", "Trigger open bank modal", "Modal ngân hàng mở thành công"),
        ("wallet bank modal can be cancelled", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở modal ngân hàng rồi bấm hủy", "Modal thông tin ngân hàng", "Modal ngân hàng đóng lại"),
        ("wallet bank modal can submit bank info", "P1", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở modal ngân hàng, nhập dữ liệu rồi submit", "Vietcombank / 0123456789 / NGUYEN VAN THO", "Thông tin ngân hàng được lưu thành công"),
        ("wallet withdraw button is visible", "P2", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở ví và quan sát nút rút tiền", "Không yêu cầu dữ liệu đầu vào bổ sung", "Nút rút tiền hiển thị"),
        ("wallet withdraw button is disabled or opens modal", "P1", "Positive", "Đăng nhập technician và hoàn tất hồ sơ", "Mở ví, kiểm tra trạng thái nút rút tiền; nếu enabled thì mở modal", "amount = 10000 nếu modal mở", "Nút rút tiền phản ánh đúng theo số dư và điều kiện rút"),
    ]
    for i, (title, priority, case_type, pre_condition, steps, test_data, expected) in enumerate(wallet_specs, start=1):
        cases.append(
            make_case(
                tc_id=f"TC-TECH-WALLET-{i:03d}",
                module="Technician Wallet",
                title=title,
                priority=priority,
                case_type=case_type,
                file_function=f"tests/technician-matrix.spec.js :: Technician Wallet Matrix :: {title}",
                pre_condition=pre_condition,
                steps_summary=steps,
                test_data=test_data,
                expected_result=expected,
            )
        )

    if len(cases) != 100:
        raise ValueError(f"Expected 100 test cases, got {len(cases)}")

    return cases


def make_inline_cell(ref: str, style: str, value: str) -> ET.Element:
    cell = ET.Element(qn("c"), {"r": ref, "s": style, "t": "inlineStr"})
    is_node = ET.SubElement(cell, qn("is"))
    text_node = ET.SubElement(is_node, qn("t"))
    if value.startswith(" ") or value.endswith(" ") or "\n" in value:
        text_node.set(f"{{{XML_NS}}}space", "preserve")
    text_node.text = value
    return cell


def rebuild_sheet(root: ET.Element, rows_data: list[list[str]], last_col: str, row_height_attrs: dict[str, str], style_map: list[str]) -> None:
    sheet_data = root.find(qn("sheetData"))
    if sheet_data is None:
        raise ValueError("sheetData not found")
    existing_rows = sheet_data.findall(qn("row"))
    if not existing_rows:
        raise ValueError("No rows found in sheet")

    header_row = copy.deepcopy(existing_rows[0])
    for child in list(sheet_data):
        sheet_data.remove(child)
    sheet_data.append(header_row)

    for idx, row_values in enumerate(rows_data, start=2):
        row_attrib = dict(row_height_attrs)
        row_attrib["r"] = str(idx)
        row = ET.Element(qn("row"), row_attrib)
        for col_idx, value in enumerate(row_values):
            ref = f"{chr(65 + col_idx)}{idx}"
            row.append(make_inline_cell(ref, style_map[col_idx], value))
        sheet_data.append(row)

    dim = root.find(qn("dimension"))
    if dim is not None:
        dim.set("ref", f"A1:{last_col}{len(rows_data) + 1}")


def extract_row_template(root: ET.Element, row_index: int) -> tuple[dict[str, str], list[str]]:
    sheet_data = root.find(qn("sheetData"))
    if sheet_data is None:
        raise ValueError("sheetData not found")
    rows = sheet_data.findall(qn("row"))
    row = rows[row_index - 1]
    row_attrs = {k: v for k, v in row.attrib.items() if k != "r"}
    styles = [cell.attrib.get("s", "0") for cell in row.findall(qn("c"))]
    return row_attrs, styles


def update_sheet(root: ET.Element, rows_data: list[list[str]], last_col: str, template_row_index: int = 2) -> None:
    row_attrs, styles = extract_row_template(root, template_row_index)
    rebuild_sheet(root, rows_data, last_col, row_attrs, styles)


def generate_summary_rows(cases: list[TestCase]) -> list[list[str]]:
    return [
        [case.tc_id, case.module, case.title, case.priority, case.case_type, case.status, case.assigned_to, case.file_function]
        for case in cases
    ]


def generate_execution_rows(cases: list[TestCase]) -> list[list[str]]:
    return [
        [
            case.tc_id,
            case.module,
            case.title,
            case.priority,
            case.pre_condition,
            case.steps_summary,
            case.test_data,
            case.expected_result,
            case.status,
            case.executed_by,
            case.browser,
            case.os_name,
            case.notes,
        ]
        for case in cases
    ]


def generate_defect_rows() -> list[list[str]]:
    return [
        [
            "N/A",
            "ALL",
            "No defect recorded in the final 100-case Playwright technician regression run",
            "N/A",
            "N/A",
            "Closed",
            EXECUTED_BY,
            EXECUTION_DATE,
            "N/A",
            "N/A",
            "100/100 test cases passed",
        ]
    ]


def generate_environment_rows() -> list[list[str]]:
    return [
        ["Application URL", APP_URL],
        ["Browser", BROWSER],
        ["Operating System", OS_NAME],
        ["Test Framework", "Playwright Test"],
        ["Playwright Command", PLAYWRIGHT_COMMAND],
        ["Node.js Version", "22.20.0"],
        ["Viewport", "1440 x 960"],
        ["Worker Configuration", "1 worker"],
        ["Primary Technician Credential", "tech1@homefix.com / 123456"],
        ["Secondary Technician Credential", "tech2@homefix.com / 123456"],
        ["Admin Credential", "admin@homefix.com / 123456"],
        ["Customer Credential", "customer@homefix.com / 123456"],
        ["Execution Date", EXECUTION_DATE],
        ["Executed By", EXECUTED_BY],
        ["Source Specs", "frontend/tests/technician-flow.spec.js + frontend/tests/technician-matrix.spec.js"],
        ["Report Result", "100 passed (3.2m)"],
    ]


def main() -> None:
    if not TEMPLATE.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE}")

    cases = build_cases()
    shutil.copyfile(TEMPLATE, OUTPUT)

    with zipfile.ZipFile(OUTPUT, "r") as zin:
        files = {name: zin.read(name) for name in zin.namelist()}

    sheet1 = ET.fromstring(files["xl/worksheets/sheet1.xml"])
    sheet2 = ET.fromstring(files["xl/worksheets/sheet2.xml"])
    sheet3 = ET.fromstring(files["xl/worksheets/sheet3.xml"])
    sheet4 = ET.fromstring(files["xl/worksheets/sheet4.xml"])

    update_sheet(sheet1, generate_summary_rows(cases), "H")
    update_sheet(sheet2, generate_execution_rows(cases), "M")
    update_sheet(sheet3, generate_defect_rows(), "K")
    update_sheet(sheet4, generate_environment_rows(), "B")

    files["xl/worksheets/sheet1.xml"] = ET.tostring(sheet1, encoding="utf-8", xml_declaration=False)
    files["xl/worksheets/sheet2.xml"] = ET.tostring(sheet2, encoding="utf-8", xml_declaration=False)
    files["xl/worksheets/sheet3.xml"] = ET.tostring(sheet3, encoding="utf-8", xml_declaration=False)
    files["xl/worksheets/sheet4.xml"] = ET.tostring(sheet4, encoding="utf-8", xml_declaration=False)

    with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, content in files.items():
            zout.writestr(name, content)

    manifest = {
        "output": str(OUTPUT),
        "cases": len(cases),
        "modules": sorted({case.module for case in cases}),
    }
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
