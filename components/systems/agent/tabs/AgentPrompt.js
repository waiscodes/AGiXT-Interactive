import { useEffect, useState } from "react";
import { useMemo } from "react";
import { useRouter } from "next/router";
import { sdk } from "../../../../lib/apiClient";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from "@mui/material";
import useSWR from "swr";
import { mutate } from "swr";

export default function AgentPrompt() {
  const [chatHistory, setChatHistory] = useState([]);
  const [message, setMessage] = useState("");
  const [conversationName, setConversationName] = useState("Test");
  const [lastResponse, setLastResponse] = useState("");
  const [contextResults, setContextResults] = useState(5);
  const [shots, setShots] = useState(1);
  const [browseLinks, setBrowseLinks] = useState(false);
  const [websearch, setWebsearch] = useState(false);
  const [websearchDepth, setWebsearchDepth] = useState(0);
  const [enableMemory, setEnableMemory] = useState(false);
  const [
    injectMemoriesFromCollectionNumber,
    setInjectMemoriesFromCollectionNumber,
  ] = useState(0);
  const [conversationResults, setConversationResults] = useState(5);
  const [promptCategory, setPromptCategory] = useState("Default");
  const [promptName, setPromptName] = useState("Chat");
  const router = useRouter();
  const agentName = useMemo(() => router.query.agent, [router.query.agent]);
  const { data: conversations } = useSWR(
    "getConversations",
    async () => await sdk.getConversations()
  );

  const { data: conversation } = useSWR(
    `conversation/${agentName}/${conversationName}`,
    async () => await sdk.getConversation(agentName, conversationName, 100, 1)
  );
  const { data: promptCategories } = useSWR(
    `promptCategories/${agentName}`,
    async () => await sdk.getPromptCategories(agentName)
  );

  const { data: prompts } = useSWR(
    `prompts/${promptCategory}`,
    async () => await sdk.getPrompts(promptCategory)
  );
  const { data: promptArgs } = useSWR(
    `promptArgs/${promptName}`,
    async () => await sdk.getPromptArgs(promptName, promptCategory)
  );
  const { data: prompt } = useSWR(
    `prompt/${promptName}`,
    async () => await sdk.getPrompt(promptName, promptCategory)
  );

  useEffect(() => {
    mutate("getConversations");
    if (conversations) {
      setConversationName(conversationName);
    }
  }, [conversationName]);
  useEffect(() => {
    mutate(`conversation/${agentName}/${conversationName}`);
    if (
      conversation != "Unable to retrieve data." &&
      conversation != undefined
    ) {
      setChatHistory(conversation);
    }
  }, [conversationName, conversation, lastResponse]);
  useEffect(() => {
    mutate(`promptCategories/${agentName}`);
    if (promptCategories) {
      setPromptCategory(promptCategory);
    }
  }, [promptCategory]);
  useEffect(() => {
    mutate(`prompts/${promptCategory}`);
    if (prompts) {
      setPromptName(promptName);
    }
    mutate(`promptArgs/${promptName}`);
    mutate(`prompt/${promptName}`);
  }, [promptName]);

  const PromptAgent = async (
    message,
    promptName = "Chat",
    promptCategory = "Default",
    contextResults = 5,
    shots = 1,
    browseLinks = false,
    websearch = false,
    websearchDepth = 0,
    enableMemory = false,
    injectMemoriesFromCollectionNumber = 0,
    conversationResults = 5
  ) => {
    // All of these fields need selectors in the UI.
    const promptArguments = {
      user_input: message,
      prompt_category: promptCategory,
      conversation_name: conversationName,
      context_results: contextResults,
      shots: shots,
      browse_links: browseLinks,
      websearch: websearch,
      websearch_depth: websearchDepth,
      enable_memory: enableMemory,
      inject_memories_from_collection_number:
        injectMemoriesFromCollectionNumber,
      conversation_results: conversationResults,
      ...promptArgs,
    };
    const response = await sdk.promptAgent(
      agentName,
      promptName,
      promptArguments
    );
    setLastResponse(response);
  };

  const handleKeyPress = async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSendMessage();
    }
  };
  const handleSendMessage = async () => {
    if (!message) return;
    await PromptAgent(
      message,
      promptName,
      promptCategory,
      contextResults,
      shots,
      browseLinks,
      websearch,
      websearchDepth,
      enableMemory,
      injectMemoriesFromCollectionNumber,
      conversationResults
    );
    setMessage("");
  };
  return (
    <>
      <br />
      <TextField
        type="number"
        label="Context Results"
        value={contextResults}
        onChange={(e) => setContextResults(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        type="number"
        label="Shots"
        value={shots}
        onChange={(e) => setShots(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        type="number"
        label="Websearch Depth"
        value={websearchDepth}
        onChange={(e) => setWebsearchDepth(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        type="number"
        label="Inject Memories from Collection"
        value={injectMemoriesFromCollectionNumber}
        onChange={(e) => setInjectMemoriesFromCollectionNumber(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Conversation Results"
        type="number"
        min={0}
        max={100}
        step={1}
        value={conversationResults}
        onChange={(e) => setConversationResults(e.target.value)}
        sx={{ mb: 2 }}
      />
      <br />
      <FormControlLabel
        control={
          <Switch
            checked={browseLinks}
            onChange={(e) => setBrowseLinks(e.target.checked)}
            name="Browse Links"
          />
        }
        label="Browse Links"
      />
      <FormControlLabel
        control={
          <Switch
            checked={websearch}
            onChange={(e) => setWebsearch(e.target.checked)}
            name="Websearch"
          />
        }
        label="Websearch"
      />
      <FormControlLabel
        control={
          <Switch
            checked={enableMemory}
            onChange={(e) => setEnableMemory(e.target.checked)}
            name="Enable Memory"
          />
        }
        label="Enable Memory"
      />
      <Typography variant="h6" gutterBottom>
        Select a Conversation
      </Typography>
      <Select
        fullWidth
        label="Conversation"
        value={conversationName}
        onChange={(e) => setConversationName(e.target.value)}
        sx={{ mb: 2 }}
      >
        {conversations
          ? conversations.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))
          : []}
      </Select>
      <Paper
        elevation={5}
        sx={{ padding: "0.5rem", overflowY: "auto", height: "60vh" }}
      >
        {chatHistory.map((chatItem, index) => (
          <div key={index} style={{ marginBottom: "10px" }}>
            <Typography variant="caption">
              {chatItem.role} - {chatItem.timestamp}
            </Typography>
            <Typography variant="body1">{chatItem.message}</Typography>
          </div>
        ))}
      </Paper>
      <br />
      <Typography gutterBottom>Select a Prompt Category</Typography>
      <Select
        fullWidth
        label="Prompt Category"
        value={promptCategory}
        onChange={(e) => setPromptCategory(e.target.value)}
        sx={{ mb: 2 }}
      >
        {promptCategories
          ? promptCategories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))
          : []}
      </Select>
      <Typography gutterBottom>Select a Prompt</Typography>
      <Select
        fullWidth
        label="Prompt"
        value={promptName}
        onChange={(e) => setPromptName(e.target.value)}
        sx={{ mb: 2 }}
      >
        {prompts
          ? prompts.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))
          : []}
      </Select>
      <Typography gutterBottom>{prompt}</Typography>

      {promptArgs ? (
        Object.values(promptArgs).map((arg) => {
          if (
            arg !== "user_input" &&
            arg !== "conversation_history" &&
            arg !== "context" &&
            arg !== "COMMANDS" &&
            arg !== "command_list" &&
            arg !== "date" &&
            arg !== "agent_name" &&
            arg !== "working_directory" &&
            arg !== "helper_agent_name"
          ) {
            return (
              <TextField
                fullWidth
                label={arg}
                value={promptArgs[arg]}
                onChange={(e) =>
                  setPromptArgs({ ...promptArgs, [arg]: e.target.value })
                }
                sx={{ mb: 2 }}
              />
            );
          }
          if (arg == "user_input") {
            return (
              <TextField
                fullWidth
                label="User Input"
                placeholder="User input..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ mb: 2 }}
              />
            );
          }
        })
      ) : (
        <></>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSendMessage}
        fullWidth
      >
        Prompt Agent
      </Button>
    </>
  );
}