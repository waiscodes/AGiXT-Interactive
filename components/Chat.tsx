import ConversationHistory from './conversation/ConversationLog';
import ConversationBar from './conversation/ConversationBar';
import Box from '@mui/material/Box';
import Header from './Header';
import { ChatProps } from './AGiXTChat';
import { useTheme } from '@mui/material';

export default function Chat({ mode, showAppBar, showConversationSelector }: ChatProps) {
  const theme = useTheme();
  return (
    <Box height='100%' display='flex' flexDirection='column'>
      {showAppBar && <Header showConversationSelector={showConversationSelector} />}

      <Box
        style={{
          maxWidth: '100%',
          flexGrow: '1',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
          }),
          display: 'flex',
          flexDirection: 'column'
        }}
        component='main'
      >
        <ConversationHistory />
        <ConversationBar mode={mode} />
      </Box>
    </Box>
  );
}
