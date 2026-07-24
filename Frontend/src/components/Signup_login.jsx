import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff } from 'lucide-react';
import googleLogo from '../assets/img/google.png';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import api from '../api/api.js';
import CreateOrgModal from './CreateOrgModal';
import { setAccessToken, getAccessToken } from '../utils/authStore.js';

const URL = import.meta.env.VITE_URL;

const Signup_login = () => {
  const [Check, setCheck] = useState(1);
  const [formData, setFormData] = useState({ Username: '', email: '', password: '', confirmPassword: '' });
  const [White, setWhite] = useState(true);
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    Password: 'Password must be at least 8 characters and include letters, numbers, and special characters'
  });

  useEffect(() => {
    const validate = () => {
      // console.log(getAccessToken());
      if (getAccessToken()) {
        
        navigate('/user/dashboard');
      }
    };
    validate();
  }, []);

  const validateEmail = email => /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  const validatePassword = password => /^(?=.*[A-Za-z])(?=.*[\d])(?=.*[!@#$%&*^]).{8,}$/.test(password);


  const handlePostAuth = async () => {
    try {
      const res = await api.get("/orgs/mine");
      console.log(res);
      navigate("/user/dashboard");
    } catch (err) {
        console.log(err);
        if (err.response?.status === 404) {
            setOrgModalOpen(true);
        }
    }
  };

  const handleCheck = (check) => {
    setCheck(check);
    setFormData({ Username: '', email: '', password: '', confirmPassword: '' });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowLoginPassword(false);
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
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Email must be a valid Gmail address';
    if (!formData.password.trim()) newErrors.Password = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.Password = 'Password must be at least 8 characters and include letters, numbers, and special characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};
    if (!formData.Username.trim()) newErrors.Username = 'Username is required';
    else if (formData.Username.length < 20)
      newErrors.Username = 'Username hast at most 20 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!validateEmail(formData.email)) newErrors.email = 'Email must be a valid Gmail address';
    if (!formData.password.trim()) newErrors.Password = 'Password is required';
    else if (!validatePassword(formData.password)) newErrors.Password = 'Password must be at least 8 characters and include letters, numbers, and special characters';
    if (!formData.confirmPassword.trim()) newErrors.confirmPassword = 'Please confirm your password';
    if (formData.confirmPassword !== formData.password) newErrors.confirmPassword = 'Passwords do not match';
    if (errors.Password) setWhite(false);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (googleResponse) => {
      try {
        const token = googleResponse.access_token;
        const apiResponse = await axios.post(
          `${URL}/user/googleauth`,
          { token },
          { withCredentials: true }
        );
        setAccessToken(apiResponse.data.accesstoken);
        toast.success("Logged in with Google successfully!");
        await handlePostAuth();
      } catch (error) {
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
      const payload = type === 'signup'
        ? { Username: formData.Username, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const token = await axios.post(`${URL}/user${endpoint}`, payload, { withCredentials: true });
      setAccessToken(token.data.accesstoken);
      toast.success(type === 'signup' ? 'Signup successful!' : 'Login successful!');
      await handlePostAuth();
    } catch (error) {
      const { field, message } = error.response?.data || {};
      if (field === 'username') {
        setErrors(prev => ({ ...prev, Username: message }));
      } else if (field === 'email') {
        setErrors(prev => ({ ...prev, email: message }));
      } else {
        toast.error(message || 'An error occurred. Please try again.');
      }
    }
  };

  const handleOrgCreated = () => {
    setOrgModalOpen(false);
    navigate('/user/dashboard');
  };

  const formVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -25, transition: { duration: 0.3, ease: "easeIn" } },
  };

  const inputCls = "w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300";
  const passwordInputCls = `${inputCls} pr-12`;
  const eyeIconCls = "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer transition-colors duration-300";

  return (
    <div className='bg-[#0d0d0d] min-h-screen overflow-x-hidden'>
      <div className='max-w-7xl mx-auto sm:ml-18 px-4 py-4 flex justify-between items-center'>
        <Link to='/' className='text-xl sm:text-2xl font-bold text-white cursor-pointer'>
          Task<span className='text-blue-500'>Forge</span>
        </Link>
      </div>

      <div className='flex justify-center items-center min-h-[calc(100vh-72px)] px-4 py-6'>
        <div className='w-full max-w-lg p-6 sm:p-8 bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-xl relative overflow-hidden'>

          <div className='flex justify-center mb-4 gap-3 sm:space-x-4'>
            {[{ label: 'Sign Up', val: 1 }, { label: 'Login', val: 0 }].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => handleCheck(val)}
                className={`w-1/2 sm:w-48 h-12 cursor-pointer rounded-full font-semibold text-base sm:text-lg transition-all duration-300 ${Check === val
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
                  <input type="text" name="Username" value={formData.Username}
                    onChange={handleChange} placeholder="Username" className={inputCls} />
                  {errors.Username && <p className="text-red-500 text-sm mt-1">{errors.Username}</p>}
                </div>

                <div className="w-full">
                  <input type="email" name="email" value={formData.email}
                    onChange={handleChange} placeholder="Email Address" className={inputCls} />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div className="w-full">
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={formData.password}
                      onChange={handleChange} placeholder="Password" autoComplete="new-password" className={passwordInputCls} />
                    {showPassword ? (
                      <EyeOff
                        size={20}
                        className={eyeIconCls}
                        onClick={() => setShowPassword(false)}
                      />
                    ) : (
                      <Eye
                        size={20}
                        className={eyeIconCls}
                        onClick={() => setShowPassword(true)}
                      />
                    )}
                  </div>
                  {errors.Password && (
                    <p className={`${White ? 'text-gray-400' : 'text-red-500'} text-sm mt-1`}>
                      {errors.Password}
                    </p>
                  )}
                </div>

                <div className="w-full">
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword}
                      onChange={handleChange} placeholder="Confirm Password" className={passwordInputCls} />
                    {showConfirmPassword ? (
                      <EyeOff
                        size={20}
                        className={eyeIconCls}
                        onClick={() => setShowConfirmPassword(false)}
                      />
                    ) : (
                      <Eye
                        size={20}
                        className={eyeIconCls}
                        onClick={() => setShowConfirmPassword(true)}
                      />
                    )}
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                <button type="submit"
                  className="w-full sm:w-60 py-3 rounded-4xl font-semibold text-white cursor-pointer bg-linear-to-r from-blue-500 to-purple-500 shadow-lg hover:from-purple-500 hover:to-blue-500 transform transition-all duration-300 hover:-translate-y-1">
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
                  <div className="relative">
                    <input type={showLoginPassword ? "text" : "password"} name="password" value={formData.password}
                      onChange={handleChange} placeholder="Password" className={passwordInputCls} />
                    {showLoginPassword ? (
                      <EyeOff
                        size={20}
                        className={eyeIconCls}
                        onClick={() => setShowLoginPassword(false)}
                      />
                    ) : (
                      <Eye
                        size={20}
                        className={eyeIconCls}
                        onClick={() => setShowLoginPassword(true)}
                      />
                    )}
                  </div>
                  {errors.Password && <p className="text-red-500 text-sm mt-1">{errors.Password}</p>}
                </div>

                <button type="submit"
                  className="w-full sm:w-60 py-3 rounded-4xl font-semibold text-white bg-linear-to-r from-blue-500 to-purple-500 shadow-lg hover:from-purple-500 hover:to-blue-500 cursor-pointer transform transition-all duration-300 hover:-translate-y-1">
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
        onClose={() => { }}
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
    className="flex items-center justify-center px-3 w-full max-w-80 h-12 gap-2 rounded-3xl bg-[whitesmoke] text-[gray] font-medium text-[16px] transition duration-200 hover:shadow-md cursor-pointer"
  >
    <img src={googleLogo} className="w-6 h-6 mr-3 shrink-0" alt="Google logo" />
    <span className="truncate">{label}</span>
  </div>
);

export default Signup_login;
