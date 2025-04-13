import React from 'react';
import { Box, Container, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';

interface MainLayoutProps {
    children: React.ReactNode;
    loading?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, loading }) => {
    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            {loading && (
                <Box sx={{ width: '100%', position: 'fixed', top: 0, zIndex: 9999 }}>
                    <LinearProgress />
                </Box>
            )}
            <Container maxWidth="lg" sx={{ py: 4 }}>
                {children}
            </Container>
        </Box>
    );
};