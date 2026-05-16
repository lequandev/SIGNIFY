const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  currency: { type: String, default: 'VND' },
  features: [{
    text: { type: String, required: true },
    icon: { type: String } // Store as Lucide icon name or HTML
  }],
  duration: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isRecommended: { type: Boolean, default: false },
  badge: { type: String },
  planType: { type: String, enum: ['individual', 'business'], default: 'individual' },
  buttonText: { type: String, default: 'Bắt đầu ngay' }
}, { timestamps: true });

const Package = mongoose.model('Package', packageSchema);

const packages = [
  // Individual Plans
  {
    name: 'Gói 1 Tháng',
    price: '39.000',
    duration: 'tháng',
    description: 'Linh hoạt truy cập vào tất cả các tính năng cao cấp.',
    buttonText: 'Bắt đầu ngay',
    planType: 'individual',
    features: [
      { text: 'Dùng giới hạn 1 tiếng / ngày' },
      { text: 'Công nghệ dịch AI cơ bản' },
      { text: 'Tất cả các phương ngữ' },
      { text: 'Không quảng cáo' },
    ],
  },
  {
    name: 'Gói 6 Tháng',
    price: '200.000',
    duration: '6 tháng',
    description: 'Tiết kiệm hơn với gói dịch vụ nửa năm.',
    buttonText: 'Chọn Gói 6 Tháng',
    planType: 'individual',
    isRecommended: true,
    badge: 'Giá Trị Nhất',
    features: [
      { text: 'Thời gian sử dụng không giới hạn' },
      { text: 'Được tùy chỉnh nhân vật' },
      { text: 'Được chọn giọng nói AI' },
      { text: 'Dịch AI thời gian thực' },
      { text: 'Không quảng cáo' },
    ],
  },
  {
    name: 'Gói 12 Tháng',
    price: '400.000',
    duration: 'năm',
    description: 'Gói cam kết dài hạn cho sự gắn kết tối đa.',
    buttonText: 'Gói Năm',
    planType: 'individual',
    badge: 'Phổ Biến Nhất',
    features: [
      { text: 'Thời gian sử dụng không giới hạn' },
      { text: 'Được tùy chỉnh nhân vật' },
      { text: 'Được chọn giọng nói AI' },
      { text: 'Dịch AI thời gian thực' },
      { text: 'Không quảng cáo' },
      { text: 'Truy cập sớm các tính năng mới' },
    ],
  },
  // Business Plans
  {
    name: 'Doanh nghiệp Khởi nghiệp',
    price: '500.000',
    duration: 'tháng',
    description: 'Hoàn hảo cho các nhóm nhỏ và tổ chức mới bắt đầu.',
    buttonText: 'Bắt đầu dùng thử',
    planType: 'business',
    features: [
      { text: 'Tối đa 5 thành viên' },
      { text: 'Dịch AI nâng cao' },
      { text: 'Bảng điều khiển quản trị' },
      { text: 'Thư viện ký hiệu tùy chỉnh' },
    ],
  },
  {
    name: 'Doanh nghiệp Pro',
    price: '1.199.000',
    duration: 'tháng',
    description: 'Mở rộng quy mô giao tiếp trong toàn công ty.',
    buttonText: 'Nâng cấp lên Pro',
    planType: 'business',
    isRecommended: true,
    badge: 'Khuyên dùng',
    features: [
      { text: 'Tối đa 10 thành viên' },
      { text: 'AI cấp độ doanh nghiệp' },
      { text: 'SSO & Bảo mật nâng cao' },
      { text: 'Hỗ trợ đa vùng' },
      { text: 'Truy cập API tích hợp' },
    ],
  },
  {
    name: 'Doanh nghiệp Lớn',
    price: 'Liên hệ',
    duration: 'báo giá',
    description: 'Giải pháp tùy chỉnh cho tác động quy mô lớn.',
    buttonText: 'Liên hệ kinh doanh',
    planType: 'business',
    features: [
      { text: 'Không giới hạn thành viên' },
      { text: 'Đào tạo AI riêng biệt' },
      { text: 'Hỗ trợ Premium 24/7' },
      { text: 'Tùy chọn triển khai riêng' },
      { text: 'Quản lý tài khoản riêng' },
    ],
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    await Package.deleteMany({});
    console.log('Cleared existing packages');
    
    await Package.insertMany(packages);
    console.log('Seed completed successfully');
    
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();
