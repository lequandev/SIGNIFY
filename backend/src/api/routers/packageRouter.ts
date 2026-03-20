import express from 'express';
import Package from '../models/packageModel';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true });
    res.status(200).json(packages);
  } catch (error: any) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách gói dịch vụ.', error: error.message });
  }
});

export default router;
