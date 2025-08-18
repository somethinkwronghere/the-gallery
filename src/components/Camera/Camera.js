import React, { useRef } from 'react';

const Camera = (props) => {
    const ref = useRef();

    return (
        <perspectiveCamera ref={ref} {...props} />
    )
}

export default Camera;
