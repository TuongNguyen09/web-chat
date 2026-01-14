import React from 'react';
import { useNavigate } from 'react-router-dom';

const StausUserCard = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/status/{userId}`);
  };    

  return (
    <div onClick={handleNavigate} className="flex items-center p-3 cursor-pointer">
      <div>
        <img
          className="h-7 w-7 lg:w-10 lg:h-10 rounded-full"
          src="https://cdn.pixabay.com/photo/2018/07/31/22/08/lion-3576045_340.jpg"
          alt=""
        />
      </div>
      <div className="ml-2 text-white">
        <p>pablo panday</p>
      </div>
    </div>
  );
};

export default StausUserCard;