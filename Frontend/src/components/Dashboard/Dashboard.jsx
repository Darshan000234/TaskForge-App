import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import toast from 'react-hot-toast';

const URL = import.meta.env.VITE_URL;
const Dashboard = () => { 
  const Navigate = useNavigate();
  const handlelogout = () => {
    axios.get(`${URL}/user/logout`, {}, { withCredentials: true });
    toast.success('Logout successful!');
    Navigate('/');
  }
  return (
    <div className='text-white'>
      <div onClick={handlelogout} className='text-red-500 cursor-pointer'>logout</div>
    </div>
  )
}

export default Dashboard