import React from "react";

const Card = ({ title, value, icon }) => {
  return (
    
      <div className="card p-6 bg-white w-[20%] m-2 text-gray-700 boredr rounded-2xl h-40 flex gap-3">
        <div className="icon text-[130%] ">{icon}</div>
        <div>
          <p className="text-[120%]" >{title}</p>
          <h2>{value}</h2>
        </div>

       
      </div>
   
  );
};

export default Card;
