import React, { useContext, useEffect, useState } from 'react';

import {
  Paper,
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Button,
  Tooltip,
  useTheme
} from '@mui/material';
import { ContentCopy as ContentCopyIcon, Download as DownloadIcon, ThumbUp, ThumbDown } from '@mui/icons-material';
import clipboardCopy from 'clipboard-copy';

import MarkdownBlock from './MarkdownBlock';
import { AGiXTContext, AGiXTState } from 'agixt-react';

export default function ConversationHistory() {
  let lastUserMessage = ''; // track the last user message
  const theme = useTheme();
  const state = useContext(AGiXTContext);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    console.log('Getting conversation', state.agent.name);
    state.mutate((oldState) => {
      return { ...oldState, chatState: { ...oldState.chatState, loading: true } };
    });
    (async () => {
      const conversation = await state.sdk.getConversation(state.agent.name, state.chatConfig.conversationName, 100, 1);
      state.mutate((oldState) => {
        return { ...oldState, chatState: { ...oldState.chatState, conversation: conversation, loading: false } };
      });
    })();
  }, [state.agent.name, state.chatConfig.conversationName]);
  useEffect(() => {
    console.log('Conversation mutated', state.chatState.conversation);
    scrollToBottom();
  }, [state.chatState.conversation]);
  return (
    <Paper
      elevation={5}
      sx={{
        overflowY: 'scroll',
        flexGrow: '1',
        backgroundColor: theme.palette.background.paper
      }}>
      <Box display='flex' flexDirection='column' sx={{ overflowY: 'auto' }}>
        {state.chatState.conversation.length > 0 && state.chatState.conversation.map ? (
          state.chatState.conversation.map((chatItem, index) => {
            if (chatItem.role === 'USER') {
              lastUserMessage = chatItem.message;
            }
            return (
              <ChatMessage key={index} chatItem={chatItem} state={state} theme={theme} lastUserMessage={lastUserMessage} />
            );
          })
        ) : (
          <Box pb='3rem'>
            <Typography variant='h1' align='center'>
              Welcome to {process.env.NEXT_PUBLIC_APP_NAME}
            </Typography>
            <Typography variant='subtitle1' align='center' mb='2rem'>
              {process.env.NEXT_PUBLIC_APP_DESCRIPTION}
            </Typography>
            <Typography variant='body1' align='center'>
              {process.env.NEXT_PUBLIC_APP_NAME} may provide inaccurate or inappropriate responses, may break character and
              comes with no warranty of any kind. By using this software you agree to hold harmless the developers of{' '}
              {process.env.NEXT_PUBLIC_APP_NAME} for any damages caused by the use of this software.
            </Typography>
          </Box>
        )}
        {state.chatState.isLoading && (
          <>
            <ChatMessage
              key={'Please Wait'}
              chatItem={{
                role: state.agent.name,
                message: state.agent.name + ' is typing...',
                timestamp: ''
              }}
              lastUserMessage={lastUserMessage}
              state={state}
              theme={theme}
            />
          </>
        )}
        <div ref={messagesEndRef} />
      </Box>
    </Paper>
  );
}

const ChatMessage = ({ chatItem, lastUserMessage, state, theme }) => {
  const AGiXTState = useContext(AGiXTContext) as AGiXTState;

  const formattedMessage =
    typeof chatItem.message === 'string'
      ? chatItem.message.replace(/\\n/g, '  \n').replace(/\n/g, '  \n')
      : chatItem.message;
  const [vote, setVote] = useState(0);
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleClickOpen = (newVote) => {
    setVote(newVote);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleCopyClick = () => {
    clipboardCopy(formattedMessage);
  };
  const handleDownloadClick = () => {
    const element = document.createElement('a');
    const file = new Blob([formattedMessage], {
      type: 'text/plain;charset=utf-8'
    });
    element.href = URL.createObjectURL(file);
    element.download = `${chatItem.role}-${chatItem.timestamp}.txt`;
    document.body.appendChild(element);
    element.click();
  };
  return (
    <Box
      sx={{
        backgroundColor:
          chatItem.role === 'USER'
            ? theme.palette.background.default
            : theme.palette.mode !== 'dark'
              ? theme.palette.primary.light
              : theme.palette.primary.dark,
        padding: '10px',
        overflow: 'hidden',
        position: 'center',
        color: theme.palette.text.primary
      }}>
      <MarkdownBlock content={formattedMessage} chatItem={chatItem} />
      {chatItem.timestamp && (
        <Typography
          variant='caption'
          style={{
            width: '100%',
            display: 'inline-block'
          }}>
          {chatItem.role === 'USER' ? 'You' : chatItem.role} • {chatItem.timestamp}
        </Typography>
      )}
      {chatItem.role != 'USER' && !state.chatState.isLoading && (
        <>
          {process.env.NEXT_PUBLIC_AGIXT_RLHF === 'true' && (
            <>
              <Tooltip title='Provide Positive Feedback'>
                <IconButton onClick={() => handleClickOpen(1)}>
                  <ThumbUp color={vote === 1 ? 'success' : 'inherit'} />
                </IconButton>
              </Tooltip>
              <Tooltip title='Provide Negative Feedback'>
                <IconButton onClick={() => handleClickOpen(-1)}>
                  <ThumbDown color={vote === -1 ? 'error' : 'inherit'} />
                </IconButton>
              </Tooltip>
            </>
          )}
          <Tooltip title='Copy Message'>
            <IconButton onClick={handleCopyClick}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title='Download Message'>
            <IconButton onClick={handleDownloadClick}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </>
      )}
      <Dialog open={open} onClose={handleClose} aria-labelledby='form-dialog-title'>
        <DialogTitle id='form-dialog-title'>Provide Feedback</DialogTitle>
        <DialogContent>
          <DialogContentText>Please provide some feedback regarding the message.</DialogContentText>
          <TextField
            margin='dense'
            id='name'
            label='Feedback'
            type='text'
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color='error'>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const messageText = `User Feedback: ${feedback} \n\n Message: ${chatItem.message} \n\n Last User Message: ${lastUserMessage}`;
              handleClose();
              if (vote === 1) {
                state.sdk.learnText(chatItem.role, lastUserMessage, messageText, 2);
              } else {
                state.sdk.learnText(chatItem.role, lastUserMessage, messageText, 3);
              }
            }}
            color='info'>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

