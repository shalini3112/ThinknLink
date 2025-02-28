import React, { useRef, useEffect, useState } from "react";

const Canvas = ({ socket, room }) => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [drawing, setDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = 800;
        canvas.height = 500;
        ctxRef.current = canvas.getContext("2d");

        // Receive draw data from other players
        socket.on("draw", ({ x, y }) => {
            ctxRef.current.lineTo(x, y);
            ctxRef.current.stroke();
        });

        return () => socket.off("draw");
    }, [socket]);

    const startDrawing = ({ nativeEvent }) => {
        const { offsetX, offsetY } = nativeEvent;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(offsetX, offsetY);
        setDrawing(true);
    };

    const draw = ({ nativeEvent }) => {
        if (!drawing) return;
        const { offsetX, offsetY } = nativeEvent;
        ctxRef.current.lineTo(offsetX, offsetY);
        ctxRef.current.stroke();

        socket.emit("draw", { x: offsetX, y: offsetY, room });
    };

    const stopDrawing = () => setDrawing(false);

    return (
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            style={{ border: "1px solid black" }}
        />
    );
};

export default Canvas;
