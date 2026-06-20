import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import googleLogo from '../assets/img/google.png';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../api/api.js';
import CreateOrgModal from './CreateOrgModal';
import { setAccessToken } from '../utils/authStore.js';

const URL = import.meta.env.VITE_URL;

const Signup_login = () => {
  const [Check, setCheck]       = useState(1);
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [White, setWhite]       = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    Password: 'Password must be at least 8 characters and include letters, numbers, and special characters'
  });

  const validateEmail    = email    => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  const validatePassword = password => /^(?=.*[A-Za-z])(?=.*[\d])(?=.*[!@#$%&*^]).{8,}$/.test(password);

  const handlePostAuth = async () => {
    try {
      const res = await api.get('/orgs/mine');
      const orgs = res.data ?? [];
      if (orgs) {
        navigate('/user/dashboard');
      } else {
        setOrgModalOpen(true);
      }
    } catch {
      navigate('/user/dashboard');
    }
  };

  const handleCheck = (check) => {
    setCheck(check);
    setFormData({ fullName: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    if (check === 1) {
      setErrors({ Password: 'Password must be at least 8 characters and include letters, numbers, and special characters' });
      setWhite(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.email.trim())    newErrors.email    = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Email must be a valid Gmail address';
    if (!formData.password.trim()) newErrors.Password = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.Password = 'Password must be at least 8 characters and include letters, numbers, and special characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!formData.fullName.trim())        newErrors.fullName        = 'Full name is required';
    if (!formData.email.trim())           newErrors.email           = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email        = 'Email must be a valid Gmail address';
    if (!formData.password.trim())        newErrors.Password        = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.Password = 'Password must be at least 8 characters and include letters, numbers, and special characters';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = 'Passwords do not match';
    if (errors.Password) setWhite(false);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        const token     = response.access_token;
        const acctoken  = await axios.post(`${URL}/user/googleauth`, { token }, { withCredentials: true });
        setAccessToken(acctoken.data.accesstoken);
        toast.dismiss();
        toast.success('Logged in with Google successfully!');
        await handlePostAuth();
      } catch (error) {
        toast.dismiss();
        toast.error(error.response?.data?.message || error.message);
      }
    },
    onError: () => toast.error('Google login failed. Please try again.'),
  });

  const handleSubmit = async (e, type) => {
    e.preventDefault();
    const isValid = type === 'signup' ? validateSignup() : validateLogin();
    if (!isValid) return;

    try {
      const endpoint = type === 'signup' ? '/signup' : '/login';
      const payload  = type === 'signup'
        ? { fullName: formData.fullName, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const token = await axios.post(`${URL}/user${endpoint}`, payload, { withCredentials: true });
      setAccessToken(token.data.accesstoken);
      toast.success(type === 'signup' ? 'Signup successful!' : 'Login successful!');
      await handlePostAuth();
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const handleOrgCreated = () => {
    setOrgModalOpen(false);
    navigate('/user/dashboard');
  };

  const formVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit:    { opacity: 0, y: -25, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const inputCls = "w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300";

  return (
    <div className='bg-[#0d0d0d]'>
      <div className='max-w-7xl ml-18 px-4 py-4 flex justify-between items-center'>
        <Link to='/' className='text-2xl font-bold text-white cursor-pointer'>
          Task<span className='text-blue-500'>Forge</span>
        </Link>
      </div>

      <div className='flex justify-center items-center min-h-screen'>
        <div className='w-lg p-8 bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-xl relative overflow-hidden'>

          <div className='flex justify-center mb-4 space-x-4'>
            {[{ label: 'Sign Up', val: 1 }, { label: 'Login', val: 0 }].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => handleCheck(val)}
                className={`w-48 h-12 cursor-pointer rounded-full font-semibold text-lg transition-all duration-300 ${
                  Check === val
                    ? 'bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {Check === 1 && (
              <motion.form
                key="signup"
                onSubmit={e => handleSubmit(e, 'signup')}
                variants={formVariants}
                initial="initial" animate="animate" exit="exit"
                className="space-y-4 flex flex-col items-center justify-center"
              >
                <div className="w-full">
                  <input type="text" name="fullName" value={formData.fullName}
                    onChange={handleChange} placeholder="Full Name" className={inputCls} />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>

                <div className="w-full">
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} placeholder="Email Address" className={inputCls} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="w-full">
                  <input type="password" name="password" value={formData.password}
                    onChange={handleChange} placeholder="Password" autoComplete="new-password" className={inputCls} />
                  {errors.Password && (
                    <p className={`${White ? 'text-gray-400' : 'text-red-500'} text-sm mt-1`}>
                      {errors.Password}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <input type="password" name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange} placeholder="Confirm Password" className={inputCls} />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                <button type="submit"
                  className="w-60 py-3 rounded-4xl font-semibold text-white cursor-pointer bg-linear-to-r from-blue-500 to-purple-500 shadow-lg hover:from-purple-500 hover:to-blue-500 transform transition-all duration-300 hover:-translate-y-1">
                  Sign Up
                </button>

                <Divider />

                <GoogleBtn label="Sign up with Google" onClick={loginWithGoogle} />
              </motion.form>
            )}

            {Check === 0 && (
              <motion.form
                key="login"
                onSubmit={e => handleSubmit(e, 'login')}
                variants={formVariants}
                initial="initial" animate="animate" exit="exit"
                className="space-y-4 flex flex-col items-center justify-center"
              >
                <div className="w-full">
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} placeholder="Email Address" className={inputCls} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="w-full">
                  <input type="password" name="password" value={formData.password}
                    onChange={handleChange} placeholder="Password" className={inputCls} />
                  {errors.Password && <p className="text-red-500 text-sm mt-1">{errors.Password}</p>}
                </div>

                <button type="submit"
                  className="w-60 py-3 rounded-4xl font-semibold text-white bg-linear-to-r from-blue-500 to-purple-500 shadow-lg hover:from-purple-500 hover:to-blue-500 cursor-pointer transform transition-all duration-300 hover:-translate-y-1">
                  Login
                </button>

                <Divider />

                <GoogleBtn label="Login with Google" onClick={loginWithGoogle} />
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateOrgModal
        isOpen={orgModalOpen}
        onClose={() => {}}
        onCreated={handleOrgCreated}
      />
    </div>
  );
};


const Divider = () => (
  <div className="flex items-center w-full">
    <div className="flex-1 border-t border-gray-800" />
    <div className="mx-2 text-[18px] font-medium text-gray-600">or</div>
    <div className="flex-1 border-t border-gray-800" />
  </div>
);

const GoogleBtn = ({ label, onClick }) => (
  <div
    onClick={onClick}
    className="flex items-center justify-center px-3 w-80 h-12 gap-2 rounded-3xl bg-[whitesmoke] text-[gray] font-medium text-[16px] transition duration-200 hover:shadow-md cursor-pointer"
  >
    <img src={googleLogo} className="w-6 h-6 mr-3" alt="Google logo" />
    <span className="truncate">{label}</span>
  </div>
);

export default Signup_login;