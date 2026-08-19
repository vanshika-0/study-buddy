import React from "react";
import PropTypes from "prop-types";

const Card = ({ title, value, icon }) => {
  return (
    <div
      className="
        group relative flex items-center gap-4
        w-full sm:w-[22%] min-w-[220px] m-2 p-6 h-40
        bg-white border-2 border-pink-100 rounded-3xl
        shadow-[0_6px_0_0_rgba(244,194,213,0.6)]
        text-gray-700
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-[0_10px_0_0_rgba(244,194,213,0.6)]
      "
    >
      <div
        className="
          flex items-center justify-center shrink-0
          w-14 h-14 rounded-2xl
          bg-pink-100 text-pink-500 text-2xl
          group-hover:scale-110 transition-transform duration-200
        "
      >
        {icon}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-pink-400">{title}</p>
        <h2 className="text-2xl font-bold text-gray-800">{value}</h2>
      </div>
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node,
};

export default Card;