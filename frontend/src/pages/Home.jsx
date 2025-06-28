import React from 'react';
import { 
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Container,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  CssBaseline
} from '@mui/material';
import { 
  Videocam as VideocamIcon,
  Login as LoginIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Enhanced modern theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#00695c',  // teal shade
      contrastText: '#fff'
    },
    secondary: {
      main: '#ffb300',  // amber shade
      contrastText: '#000'
    },
    background: {
      default: '#f5f5f5',
      paper: '#fff'
    }
  },
  typography: {
    fontFamily: ['Inter','Roboto','sans-serif'].join(','),
    h3: { fontWeight: 700, letterSpacing: '0.5px' },
    h4: { fontWeight: 600, letterSpacing: '0.25px' },
    h5: { fontWeight: 500, letterSpacing: '0.1px' },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: 'none' }
      }
    }
  }
});

export const Home = () => {
  const features = [
    { icon: <VideocamIcon fontSize="large" color="primary" />, title: 'HD Video Calls', description: 'Crystal clear video quality with noise cancellation' },
    { icon: <GroupIcon fontSize="large" color="primary" />, title: 'Group Meetings', description: 'Host meetings with up to 50 participants' },
    { icon: <SettingsIcon fontSize="large" color="primary" />, title: 'Easy Setup', description: 'No downloads required - works in any browser' }
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', overflowX: 'hidden' }}>

        {/* App Bar */}
        <AppBar position="static" color="primary">
          <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 6 } }}>
            <Toolbar>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <VideocamIcon color="inherit" fontSize="large" />
                <Typography variant="h6" color="inherit" sx={{ ml: 1 }}>
                  VideoConnect
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 4 }}>
                <Button color="inherit">Features</Button>
                <Button color="inherit">Pricing</Button>
                <Button color="inherit">About</Button>
              </Box>
              <Box>
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<LoginIcon />}
                  component={Link}
                  to="/login"
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<VideocamIcon />}
                  component={Link}
                  to="/signup"
                  sx={{ ml: 2, px: 3 }}
                >
                  Get Started
                </Button>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>

        {/* Hero Section */}
        <Box sx={{ bgcolor: 'background.default', py: 12, flexGrow: 1 }}>
          <Container maxWidth={false} disableGutters sx={{ px: { xs: 3, md: 8 } }}>
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="h3" component="h1" gutterBottom>
                  Connect Face-to-Face in Real Time
                </Typography>
                <Typography variant="h5" color="text.secondary" paragraph>
                  Premium video conferencing solution for teams and individuals. Experience seamless communication with enterprise‑grade security.
                </Typography>
                <Box sx={{ mt: 5, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    component={Link}
                    to="/meeting/new"
                    endIcon={<ArrowForwardIcon />}
                  >
                    Start New Meeting
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="large"
                    component={Link}
                    to="/join"
                    startIcon={<LoginIcon />}
                  >
                    Join a Meeting
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={3}
                  sx={{
                    height: 420,
                    borderRadius: 4,
                    bgcolor: 'grey.100'
                  }}
                />
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 12, bgcolor: 'grey.100' }}>
          <Container maxWidth={false} disableGutters sx={{ px: { xs: 3, md: 8 } }}>
            <Box textAlign="center" mb={10}>
              <Typography variant="h4" gutterBottom>
                Why Choose VideoConnect
              </Typography>
              <Typography variant="h5" color="text.secondary" maxWidth="lg" mx="auto">
                Professional‑grade video conferencing made simple and accessible
              </Typography>
            </Box>
            <Grid container spacing={6} justifyContent="center">
              {features.map((feature, idx) => (
                <Grid item xs={12} sm={6} md={4} key={idx}>
                  <Card elevation={4} sx={{ height: '100%', '&:hover': { boxShadow: 8 } }}>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                      {feature.icon}
                      <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>
                        {feature.title}
                      </Typography>
                      <Typography color="text.secondary">
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* CTA Section */}
        <Box sx={{ py: 12, bgcolor: 'primary.main', color: 'common.white' }}>
          <Container maxWidth={false} disableGutters sx={{ px: { xs: 3, md: 8 }, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>
              Ready to Connect?
            </Typography>
            <Typography variant="h5" sx={{ mb: 5, opacity: 0.85 }}>
              Join millions of users who trust us for their daily communication
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              component={Link}
              to="/signup"
              endIcon={<VideocamIcon />}
            >
              Create Free Account
            </Button>
          </Container>
        </Box>

        {/* Footer */}
        <Box component="footer" sx={{ bgcolor: 'grey.900', color: 'common.white', py: 8 }}>
          <Container maxWidth={false} disableGutters sx={{ px: { xs: 3, md: 8 } }}>
            <Grid container spacing={4} justifyContent="space-between">
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <VideocamIcon color="secondary" fontSize="large" />
                  <Typography variant="h6" color="inherit" sx={{ ml: 1 }}>
                    VideoConnect
                  </Typography>
                </Box>
                <Typography color="grey.400">
                  Premium video conferencing solution for modern teams.
                </Typography>
              </Grid>
              {[
                { title: 'Product', items: ['Features','Pricing','Download'] },
                { title: 'Company', items: ['About Us','Careers','Contact'] },
                { title: 'Legal', items: ['Privacy Policy','Terms of Service','Security'] }
              ].map((section, i) => (
                <Grid item xs={6} md={2} key={i}>
                  <Typography variant="subtitle1" gutterBottom>
                    {section.title}
                  </Typography>
                  <List dense>
                    {section.items.map((item,j) => (
                      <ListItem key={j} disableGutters>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              ))}
            </Grid>
            <Divider sx={{ my: 6, bgcolor: 'grey.700' }} />
            <Typography variant="body2" color="grey.500" textAlign="center">
              &copy; {new Date().getFullYear()} VideoConnect. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};
