import React from 'react';

const AdditionalInfo = ({ info }) => {
  
  return info ? <p className="info-box">{info}</p> : null;
};

export default AdditionalInfo;