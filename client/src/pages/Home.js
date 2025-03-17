import axios from 'axios';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { logout, setOnlineUser, setSocketConnection, setUser } from '../redux/userSlice';
import Sidebar from '../components/Sidebar';
import logo from '../assets/logo.png';
import io from 'socket.io-client';

const Home = () => {
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('user', user);

  const fetchUserDetails = async () => {
    try {
      const URL = `${process.env.REACT_APP_BACKEND_URL}/api/user-details`;
      const response = await axios({
        url: URL,
        withCredentials: true
      });

      dispatch(setUser(response.data.data));

      if (response.data.data.logout) {
        dispatch(logout());
        navigate("/email");
      }
      console.log("current user Details", response);
    } catch (error) {
      console.log("error", error);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  /***socket connection ***/
  useEffect(() => {
    const socketConnection = io(process.env.REACT_APP_BACKEND_URL, {
      auth: {
        token: localStorage.getItem('token')
      },
    });

    socketConnection.on('onlineUser', (data) => {
      console.log(data);
      dispatch(setOnlineUser(data));
    });

    dispatch(setSocketConnection(socketConnection));

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  const isOnHomePage = location.pathname === '/';

  return (
    <div className='grid lg:grid-cols-[300px,1fr] h-screen max-h-screen'>
      {/* Sidebar */}
      <section className={`bg-white ${!isOnHomePage && "hidden"} lg:block`}>
        <Sidebar />
      </section>

      {/* Message Component */}
      <section className={`${isOnHomePage && "hidden"}`}>
        <Outlet />
      </section>

      {/* Default Home Page View */}
      {isOnHomePage && (
        <div className='justify-center items-center flex-col gap-2 hidden lg:flex'>
          <div>
            <img src={logo} width={250} alt='logo' />
          </div>
          <p className='text-lg mt-2 text-slate-500'>Select a user to start messaging</p>
        </div>
      )}
    </div>
  );
};

export default Home;
