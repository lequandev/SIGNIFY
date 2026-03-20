import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import payos from '../../lib/payos';
import Package from '../models/packageModel';
import Transaction from '../models/transactionModel';

export const createPaymentLink = async (req: AuthRequest, res: Response) => {
  try {
    const { packageId, name } = req.body;
    const user = req.user;

    // 1. Check if user is individual
    if (user.role !== 'individual') {
      return res.status(403).json({ message: 'Chỉ tài khoản cá nhân mới có thể thanh toán gói dịch vụ này.' });
    }

    // 2. Get package details (support ID or Name for mock compatibility)
    let pkg;
    if (packageId) {
      pkg = await Package.findById(packageId);
    } else if (name) {
      // Find by name (case-insensitive)
      pkg = await Package.findOne({ 
        name: { $regex: new RegExp("^" + name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") }
      });
    }

    if (!pkg) {
      return res.status(404).json({ message: 'Gói dịch vụ không tồn tại.' });
    }

    // Parse price to number (e.g., "500.000" -> 500000)
    const amount = parseInt(pkg.price.replace(/\./g, ''));
    if (isNaN(amount)) {
      return res.status(400).json({ message: 'Giá gói dịch vụ không hợp lệ.' });
    }

    // 3. Generate unique orderCode (number)
    const orderCode = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);

    // 4. Create Transaction record
    const transaction = new Transaction({
      orderCode,
      userId: user._id,
      packageId: pkg._id,
      amount,
      description: `Thanh toán gói ${pkg.name}`,
      status: 'pending',
    });

    await transaction.save();

    // 5. Create PayOS payment link
    const domain = process.env.FRONTEND_URL || 'http://localhost:5173';
    const body = {
      orderCode,
      amount,
      description: `SIGNIFY ${pkg.name.toUpperCase()}`.substring(0, 25),
      items: [
        {
          name: pkg.name,
          quantity: 1,
          price: amount,
        },
      ],
      returnUrl: `${domain}/payment-success`,
      cancelUrl: `${domain}/payment-cancel`,
    };

    const paymentLinkRes = await payos.paymentRequests.create(body);

    // 6. Update transaction with payment ID and URL
    // PayOS v2 returns checkoutUrl
    transaction.checkoutUrl = paymentLinkRes.checkoutUrl;
    transaction.payosOrderCode = orderCode;
    transaction.paymentLinkId = paymentLinkRes.paymentLinkId;
    await transaction.save();

    res.status(200).json(paymentLinkRes);
  } catch (error: any) {
    console.error('PayOS Error:', error);
    res.status(500).json({ message: 'Lỗi khi tạo liên kết thanh toán.', error: error.message });
  }
};

export const handleWebhook = async (req: AuthRequest, res: Response) => {
  try {
    const webhookData = req.body;
    console.log('Webhook Received:', JSON.stringify(webhookData, null, 2));
    
    // PayOS v2: orderCode is in data object
    const { orderCode, code } = webhookData.data || {};
    const transaction = await Transaction.findOne({ orderCode });

    if (transaction) {
      if (code === '00' || webhookData.code === '00') {
        transaction.status = 'paid';
        console.log(`Transaction ${orderCode} found and marked as PAID.`);
      } else {
        transaction.status = 'cancelled';
        console.log(`Transaction ${orderCode} found and marked as CANCELLED.`);
      }
      await transaction.save();
    } else {
      console.log(`No transaction found for orderCode: ${orderCode}`);
    }

    res.status(200).json({ message: 'Webhook received' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
};

export const checkPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { orderCode } = req.params;
    const transaction = await Transaction.findOne({ orderCode: parseInt(orderCode as string) });

    if (!transaction) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch.' });
    }

    res.status(200).json({ status: transaction.status });
  } catch (error: any) {
    console.error('Check Status Error:', error);
    res.status(500).json({ message: 'Lỗi khi kiểm tra trạng thái thanh toán.' });
  }
};
