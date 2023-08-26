import { useState } from "react";
import { useRouter } from "next/router";
import { sdk } from "../../../../lib/apiClient";
import { Typography, Paper, TextField, Button } from "@mui/material";
export default function AgentInstruct() {
  const [responseHistory, setResponseHistory] = useState([]);
  const [instruction, setInstruction] = useState("");
  const agentName = useRouter().query.agent;
  // TODO: Add conversationName drop down
  const conversationName = "default";
  const InstructAgent = async () => {
    if (instruction?.length <= 0) console.log("ha");
    const response = await sdk.instruct(
      agentName,
      instruction,
      conversationName
    );
    console.log(response);
    setResponseHistory((old) => [
      ...old,
      `You: ${instruction}`,
      `Agent: ${response}`,
    ]);
  };
  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleInstruct();
    }
  };
  const handleInstruct = async () => {
    await InstructAgent();
    setInstruction("");
  };
  return (
    <>
      <>
        <TextField
          fullWidth
          label="Enter Instruction for Agent"
          placeholder="Instruction..."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleInstruct}
          fullWidth
        >
          Instruct Agent
        </Button>
      </>
      <Typography variant="h6" gutterBottom>
        Agent Instruction
      </Typography>
      <Paper
        elevation={5}
        sx={{ padding: "0.5rem", overflowY: "auto", height: "60vh" }}
      >
        {responseHistory.map((message, index) => (
          <pre key={index} style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {message}
          </pre>
        ))}
      </Paper>
    </>
  );
}
