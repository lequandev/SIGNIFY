package com.signify.modules.subscription.config;

import com.signify.modules.subscription.model.ServicePackage;
import com.signify.modules.subscription.repository.ServicePackageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final ServicePackageRepository servicePackageRepository;

    @Override
    public void run(String... args) throws Exception {
        if (servicePackageRepository.count() == 0) {
            log.info("Seeding service packages...");
            
            List<ServicePackage> packages = new ArrayList<>();

            // Individual - 1 Month
            packages.add(ServicePackage.builder()
                    .planType("individual")
                    .name("1 Tháng")
                    .price("39,000")
                    .duration("tháng")
                    .durationDays(30)
                    .description("Linh hoạt trải nghiệm mọi tính năng cao cấp theo từng tháng.")
                    .buttonText("Bắt Đầu Ngay")
                    .isRecommended(false)
                    .features(Arrays.asList(
                            new ServicePackage.Feature("Cpu", "Dịch thuật AI theo thời gian thực"),
                            new ServicePackage.Feature("Zap", "Không giới hạn số phút sử dụng mỗi ngày"),
                            new ServicePackage.Feature("Globe", "Hỗ trợ tất cả các phương ngữ ngôn ngữ ký hiệu"),
                            new ServicePackage.Feature("Shield", "Trải nghiệm hoàn toàn không quảng cáo")
                    ))
                    .createdAt(LocalDateTime.now())
                    .build());

            // Individual - 6 Months
            packages.add(ServicePackage.builder()
                    .planType("individual")
                    .name("6 Tháng")
                    .price("200,000")
                    .duration("6 tháng")
                    .durationDays(180)
                    .description("Tiết kiệm chi phí hơn với gói đăng ký nửa năm.")
                    .buttonText("Chọn Gói 6 Tháng")
                    .isRecommended(true)
                    .badge("Tiết Kiệm Nhất")
                    .features(Arrays.asList(
                            new ServicePackage.Feature("Cpu", "Dịch thuật AI theo thời gian thực"),
                            new ServicePackage.Feature("Zap", "Không giới hạn số phút sử dụng mỗi ngày"),
                            new ServicePackage.Feature("Globe", "Hỗ trợ tất cả các phương ngữ ngôn ngữ ký hiệu"),
                            new ServicePackage.Feature("Shield", "Trải nghiệm hoàn toàn không quảng cáo"),
                            new ServicePackage.Feature("MessageSquare", "Ưu tiên xử lý dữ liệu AI tốc độ cao")
                    ))
                    .createdAt(LocalDateTime.now())
                    .build());

            // Individual - 12 Months
            packages.add(ServicePackage.builder()
                    .planType("individual")
                    .name("12 Tháng")
                    .price("400,000")
                    .duration("năm")
                    .durationDays(365)
                    .description("Giải pháp kết nối dài hạn và trọn vẹn nhất.")
                    .buttonText("Đăng Ký Gói Năm")
                    .isRecommended(false)
                    .badge("Phổ Biến Nhất")
                    .features(Arrays.asList(
                            new ServicePackage.Feature("Cpu", "Dịch thuật AI theo thời gian thực"),
                            new ServicePackage.Feature("Zap", "Không giới hạn số phút sử dụng mỗi ngày"),
                            new ServicePackage.Feature("Globe", "Hỗ trợ tất cả các phương ngữ ngôn ngữ ký hiệu"),
                            new ServicePackage.Feature("Shield", "Trải nghiệm hoàn toàn không quảng cáo"),
                            new ServicePackage.Feature("MessageSquare", "Ưu tiên xử lý dữ liệu AI tốc độ cao"),
                            new ServicePackage.Feature("Users", "Trải nghiệm sớm các tính năng mới")
                    ))
                    .createdAt(LocalDateTime.now())
                    .build());

            // Business - Small
            packages.add(ServicePackage.builder()
                    .planType("business")
                    .name("Doanh Nghiệp Nhỏ")
                    .price("799,000")
                    .duration("tháng")
                    .durationDays(30)
                    .description("Lựa chọn hoàn hảo cho các nhóm nhỏ và tổ chức quy mô vừa.")
                    .buttonText("Dùng Thử Miễn Phí")
                    .isRecommended(false)
                    .features(Arrays.asList(
                            new ServicePackage.Feature("Users", "Hỗ trợ tối đa 5 thành viên"),
                            new ServicePackage.Feature("Cpu", "Công nghệ dịch thuật AI nâng cao"),
                            new ServicePackage.Feature("Shield", "Bảng điều khiển dành cho quản trị viên"),
                            new ServicePackage.Feature("Globe", "Thư viện ký hiệu tùy chỉnh riêng")
                    ))
                    .createdAt(LocalDateTime.now())
                    .build());

            // Business - Large
            packages.add(ServicePackage.builder()
                    .planType("business")
                    .name("Doanh Nghiệp Lớn")
                    .price("1,999,000")
                    .duration("tháng")
                    .durationDays(30)
                    .description("Mở rộng giải pháp kết nối toàn diện cho toàn bộ công ty.")
                    .buttonText("Nâng Cấp Lên Gói Pro")
                    .isRecommended(true)
                    .badge("Gợi Ý Cho Bạn")
                    .features(Arrays.asList(
                            new ServicePackage.Feature("Users", "Hỗ trợ tối đa 25 thành viên"),
                            new ServicePackage.Feature("Cpu", "Hệ thống AI chuẩn doanh nghiệp"),
                            new ServicePackage.Feature("Shield", "Bảo mật nâng cao & Đăng nhập một lần (SSO)"),
                            new ServicePackage.Feature("Globe", "Hỗ trợ đa vùng và đa quốc gia"),
                            new ServicePackage.Feature("Video", "Cung cấp quyền truy cập API để tích hợp hệ thống")
                    ))
                    .createdAt(LocalDateTime.now())
                    .build());

            // Enterprise
            packages.add(ServicePackage.builder()
                    .planType("business")
                    .name("Tập Đoàn")
                    .price("Liên hệ")
                    .duration("báo giá")
                    .durationDays(null)
                    .description("Giải pháp thiết kế riêng biệt nhằm tạo nên tầm ảnh hưởng quy mô lớn.")
                    .buttonText("Liên Hệ Phòng Kinh Doanh")
                    .isRecommended(false)
                    .features(Arrays.asList(
                            new ServicePackage.Feature("Users", "Không giới hạn số lượng thành viên"),
                            new ServicePackage.Feature("Cpu", "Huấn luyện mô hình AI chuyên biệt theo yêu cầu"),
                            new ServicePackage.Feature("Shield", "Hỗ trợ kỹ thuật cao cấp 24/7"),
                            new ServicePackage.Feature("Globe", "Tùy chọn triển khai hệ thống riêng (On-premise/Cloud)"),
                            new ServicePackage.Feature("MessageSquare", "Có chuyên viên quản lý tài khoản riêng")
                    ))
                    .createdAt(LocalDateTime.now())
                    .build());

            servicePackageRepository.saveAll(packages);
            log.info("Service packages seeded successfully!");
        }
    }
}
