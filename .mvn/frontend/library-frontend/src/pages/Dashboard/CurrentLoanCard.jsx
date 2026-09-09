import { AccessTime, MenuBook } from '@mui/icons-material';
import { Button, Chip } from '@mui/material';
import React from 'react'
import { formatDate } from "../../utils/locale";
import { Link } from "react-router-dom";
import GetStatusChip from './GetStatusChip';

const CurrentLoanCard = ({ loan }) => {
    const overdue = loan.status === "OVERDUE" || loan.isOverdue;
    const dayCount = overdue ? Number(loan.overdueDays || 0) : Math.max(Number(loan.remainingDays || 0), 0);
    return (
        <div
            className="flex flex-col gap-4 sm:flex-row items-center justify-between p-6
      border border-gray-200 rounded-2xl "
        >
            <div className="flex items-center space-x-4 flex-1">
                <div className="flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
                    {loan.bookCoverImage ? <img src={loan.bookCoverImage} alt={`Bìa ${loan.bookTitle}`} className="h-full w-full object-cover" /> : <MenuBook className="text-white" />}
                </div>
                <div className="">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{loan.bookTitle}</h4>
                    <p className="text-gray-600 mb-2">Tác giả: {loan.bookAuthor}</p>

                    <div className="flex items-center space-x-4 text-sm">

                        <div className="flex items-center space-x-4 text-sm">

                            <AccessTime sx={{ fontSize: 16 }} />
                            <span>Hạn trả: {formatDate(loan.dueDate)}</span>
                        </div>
                        <GetStatusChip status={loan.status} />
                        <Chip label={`${overdue ? 'Quá hạn' : 'Còn'} ${dayCount} ngày`} size="small" variant="outlined" color={overdue ? "error" : "default"} />

                    </div>
                </div>

            </div>
            <div>
                <Button component={Link} to="/my-loans" variant="outlined">Xem phiếu mượn</Button>
            </div>
        </div>
    );
};

export default CurrentLoanCard
