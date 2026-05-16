import { Router } from 'express';
import { registerUser, loginUser, verifyEmail, googleLogin } from '../controller/userController';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/verify/:token', verifyEmail);
router.post('/google-login', googleLogin);

export default router;
