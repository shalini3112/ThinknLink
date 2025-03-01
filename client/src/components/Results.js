import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Results = ({ socket }) => {
    const { roomId } = useParams();
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        socket.emit("get-results", { roomId });

        socket.on("results", (data) => {
            setSubmissions(data);
        });

        return () => {
            socket.off("results");
        };
    }, [socket, roomId]);

    return (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
            <h1>Results</h1>
            {submissions.map((sub, index) => (
                <p key={index}><strong>{sub.username}:</strong> {sub.chain.join(" → ")}</p>
            ))}
        </div>
    );
};

export default Results;