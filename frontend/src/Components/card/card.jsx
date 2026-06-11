import React from 'react'
import "../card/card.css"
const Card = ({title,value, icon:Icon, bgColor}) => {
  return (
    <div className='dash-card'>
        <div className='dash-card-cont'>
            <div className='card-title'>

              {/* hey */}

              <h1 className='title'>{title}</h1>
            </div>
            <div className='card-values' style={{ backgroundColor: bgColor }}>
                <p className='value'>{value}</p>
                {Icon && <Icon size={25} className="icon-card"/>}


            </div>
        </div>
      
    </div>
  )
}

export default Card;
