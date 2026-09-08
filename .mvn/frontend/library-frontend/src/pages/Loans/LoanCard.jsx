import {
    AssignmentReturn,
    Autorenew,
    CalendarToday,
    MenuBook,
    Numbers,
    Payment,
    Person
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Divider, Typography } from '@mui/material'
import { formatDate, formatMoney } from "../../utils/locale";
import { useNavigate } from 'react-router-dom';

const LoanCard = ({ loan, onRenew, onPayFine, onReturn }) => {
    const navigate = useNavigate();
    const canRenew = () => loan.status === 'CHECKED_OUT'
        && !loan.returnDate
        && loan.renewalCount < loan.maxRenewals;
    return (
        <Card>
            <CardContent sx={{ p: 3 }}>
                <Box
                    sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>

                    {/* Book Cover */}
                    <Box sx={{
                        width: 80,
                        height: 120,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        cursor: 'pointer',
                        transition: 'transform 0.3s',
                        '&:hover': {
                            transform: 'scale(1.05)',
                        }
                    }} >

                        <MenuBook sx={{
                            fontSize: 40,
                            color: 'white',
                            opacity: 0.9
                        }} />

                    </Box>

                    {/* book details */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6">
                            {loan.bookTitle}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Person sx={{ fontSize: 16 }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {loan.bookAuthor}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Numbers sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                ISBN: {loan.bookIsbn}
                            </Typography>
                        </Box>

                    </Box>

                    <Divider orientation="vertical"
                        flexItem
                        sx={{ display: { xs: 'none', md: 'block' } }} />

                    {/* loan details */}
                    <Box sx={{ flex: 1 }}>

                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>

                            {/* Ngày mượn */}
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Ngày mượn
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 14, color: '#667eea' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {formatDate(loan.checkoutDate)}
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Hạn trả */}
                            <Box>
                                <Typography
                                    variant="caption"
                                    sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                                >
                                    Hạn trả
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <CalendarToday sx={{ fontSize: 14, color: "#667eea" }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {formatDate(loan.dueDate)}
                                    </Typography>
                                </Box>
                            </Box>

                            {loan.returnDate && <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                    Ngày trả
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AssignmentReturn sx={{ fontSize: 14, color: '#10B981' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {formatDate(loan.returnDate)}
                                    </Typography>
                                </Box></Box>}
                        </Box>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/books/${loan.bookId}`)}
                        sx={{
                            borderColor: '#667eea',
                            color: '#667eea',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: '#764ba2',
                                bgcolor: 'rgba(102, 126, 234, 0.05)',
                            },
                        }}
                    >
                        Xem thông tin sách
                    </Button>

                    {canRenew() && (
                        <Button
                            size="small"
                            variant="contained"
                            startIcon={<Autorenew />}
                            disabled={!onRenew}
                            onClick={() => onRenew?.(loan.id)}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                textTransform: 'none',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                                },
                                transition: 'all 0.3s',
                            }}
                        >
                            Gia hạn sách
                        </Button>
                    )}

                    {loan.fineAmount > 0 && !loan.finePaid && (
                        <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<Payment />}
                            disabled={!onPayFine}
                            onClick={() => onPayFine?.(loan)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s',
                            }}
                        >
                            Thanh toán phạt {formatMoney(loan.fineAmount)}
                        </Button>
                    )}

                    {loan.status === 'CHECKED_OUT' && !loan.returnDate && (
                        <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            startIcon={<AssignmentReturn />}
                            disabled={!onReturn}
                            onClick={() => onReturn?.(loan.id)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                },
                                transition: 'all 0.3s',
                            }}
                        >
                            Trả sách
                        </Button>
                    )}
                </Box>



            </CardContent>
        </Card >
    );
};

export default LoanCard
