import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import Avatar from './Avatar';
import { HiDotsVertical } from "react-icons/hi";
import { FaAngleLeft, FaPlus, FaImage, FaVideo } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { IoMdSend } from "react-icons/io";
import uploadFile from '../helpers/uploadFile';
import Loading from './Loading';
import backgroundImage from '../assets/wallapaper.jpeg';
import moment from 'moment';

const MessagePage = () => {
  const params = useParams();
  const socketConnection = useSelector(state => state?.user?.socketConnection);
  const user = useSelector(state => state?.user);
  
  const [dataUser, setDataUser] = useState({
    name: "",
    email: "",
    profile_pic: "",
    online: false,
    _id: ""
  });

  const [openImageVideoUpload, setOpenImageVideoUpload] = useState(false);
  const [message, setMessage] = useState({
    text: "",
    imageUrl: "",
    videoUrl: ""
  });

  const [loading, setLoading] = useState(false);
  const [allMessage, setAllMessage] = useState([]);
  const currentMessage = useRef(null);

  // Scroll to latest message
  useEffect(() => {
    if (currentMessage.current) {
      currentMessage.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [allMessage]);

  // Toggle image/video upload popup
  const handleUploadImageVideoOpen = () => setOpenImageVideoUpload(prev => !prev);

  // Upload image
  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    setLoading(true);
    const uploadPhoto = await uploadFile(file);
    setLoading(false);
    setOpenImageVideoUpload(false);

    setMessage(prev => ({ ...prev, imageUrl: uploadPhoto.url }));
  };

  const handleClearUploadImage = () => setMessage(prev => ({ ...prev, imageUrl: "" }));

  // Upload video
  const handleUploadVideo = async (e) => {
    const file = e.target.files[0];
    setLoading(true);
    const uploadPhoto = await uploadFile(file);
    setLoading(false);
    setOpenImageVideoUpload(false);

    setMessage(prev => ({ ...prev, videoUrl: uploadPhoto.url }));
  };

  const handleClearUploadVideo = () => setMessage(prev => ({ ...prev, videoUrl: "" }));

  // Socket events for message data and user status
  useEffect(() => {
    if (socketConnection) {
      socketConnection.emit('message-page', params.userId);
      socketConnection.emit('seen', params.userId);

      socketConnection.on('message-user', (data) => setDataUser(data));
      socketConnection.on('message', (data) => setAllMessage(data));
    }
  }, [socketConnection, params?.userId, user]);

  // Handle message input
  const handleOnChange = (e) => {
    const { value } = e.target;
    setMessage(prev => ({ ...prev, text: value }));
  };

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.text || message.imageUrl || message.videoUrl) {
      if (socketConnection) {
        socketConnection.emit('new message', {
          sender: user?._id,
          receiver: params.userId,
          text: message.text,
          imageUrl: message.imageUrl,
          videoUrl: message.videoUrl,
          msgByUserId: user?._id
        });
        setMessage({ text: "", imageUrl: "", videoUrl: "" });
      }
    }
  };

  return (
    <div style={{ backgroundImage: `url(${backgroundImage})` }} className='bg-no-repeat bg-cover'>
      {/* Header */}
      <header className='sticky top-0 h-16 bg-white flex justify-between items-center px-4'>
        <div className='flex items-center gap-4'>
          <Link to="/" className='lg:hidden'><FaAngleLeft size={25} /></Link>
          <Avatar width={50} height={50} imageUrl={dataUser?.profile_pic} name={dataUser?.name} userId={dataUser?._id} />
          <div>
            <h3 className='font-semibold text-lg my-0'>{dataUser?.name}</h3>
            <p className='-my-2 text-sm'>
              {dataUser.online ? <span className='text-primary'>online</span> : <span className='text-slate-400'>offline</span>}
            </p>
          </div>
        </div>
        <button className='cursor-pointer hover:text-primary'><HiDotsVertical /></button>
      </header>

      {/* Messages */}
      <section className='h-[calc(100vh-128px)] overflow-x-hidden overflow-y-scroll scrollbar bg-slate-200 bg-opacity-50'>
        <div className='flex flex-col gap-2 py-2 mx-2' ref={currentMessage}>
          {allMessage.map((msg, index) => (
            <div 
              key={msg._id || index} 
              className={`p-1 py-1 rounded w-fit max-w-[280px] md:max-w-sm lg:max-w-md ${user._id === msg?.msgByUserId ? "ml-auto bg-teal-100" : "bg-white"}`}
            >
              {msg?.imageUrl && <img src={msg.imageUrl} className='w-full h-full object-scale-down' />}
              {msg?.videoUrl && <video src={msg.videoUrl} className='w-full h-full object-scale-down' controls />}
              <p className='px-2'>{msg.text}</p>
              <p className='text-xs ml-auto w-fit'>{moment(msg.createdAt).format('hh:mm')}</p>
            </div>
          ))}
        </div>
        {loading && <div className='w-full h-full flex sticky bottom-0 justify-center items-center'><Loading /></div>}
      </section>

      {/* Send Message Section */}
      <section className='h-16 bg-white flex items-center px-4'>
        <div className='relative'>
          <button onClick={handleUploadImageVideoOpen} className='flex justify-center items-center w-11 h-11 rounded-full hover:bg-primary hover:text-white'><FaPlus size={20} /></button>
          {openImageVideoUpload && (
            <div className='bg-white shadow rounded absolute bottom-14 w-36 p-2'>
              <form>
                <label htmlFor='uploadImage' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'><FaImage size={18} /><p>Image</p></label>
                <label htmlFor='uploadVideo' className='flex items-center p-2 px-3 gap-3 hover:bg-slate-200 cursor-pointer'><FaVideo size={18} /><p>Video</p></label>
                <input type='file' id='uploadImage' onChange={handleUploadImage} className='hidden' />
                <input type='file' id='uploadVideo' onChange={handleUploadVideo} className='hidden' />
              </form>
            </div>
          )}
        </div>
        <form className='h-full w-full flex gap-2' onSubmit={handleSendMessage}>
          <input type='text' placeholder='Type here message...' className='py-1 px-4 outline-none w-full h-full' value={message.text} onChange={handleOnChange} />
          <button className='text-primary hover:text-secondary'><IoMdSend size={28} /></button>
        </form>
      </section>
    </div>
  );
};

export default MessagePage;
