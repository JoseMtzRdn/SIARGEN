import React from 'react';
import { createPortal } from 'react-dom';

const ModalPortal = ({ children }) => {
  
  return createPortal(
    <div className="relative z-[9999]">
      {children}
    </div>,
    document.body
  );
};

export default ModalPortal;
