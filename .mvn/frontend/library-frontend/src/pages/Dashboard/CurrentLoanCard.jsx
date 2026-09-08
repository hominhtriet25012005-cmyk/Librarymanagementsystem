import { AccessTime } from '@mui/icons-material';
import { Button, Chip } from '@mui/material';
import React from 'react'
import { formatDate } from "../../utils/locale";
import { Link } from "react-router-dom";
import GetStatusChip from './GetStatusChip';

const CurrentLoanCard = ({ loan }) => {
    return (
        <div
            className="flex flex-col gap-4 sm:flex-row items-center justify-between p-6
      border border-gray-200 rounded-2xl "
        >
            <div className="flex items-center space-x-4 flex-1">
                <div className="">
                    <img
                        src={loan.bookCoverImage}
                        alt={loan.bookTitle}
                        className="w-16 h-24 rounded-lg"
                    />
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
                        <Chip label={`${loan.remainingDays > 0 ? 'Còn' : 'Quá hạn'} ${loan.remainingDays > 0 ? loan.remainingDays : loan.overdueDays} ngày`} size="small" variant="outlined" />

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
