import React from 'react'
import CurrentLoanCard from './CurrentLoanCard';

const loan = {
    bookTitle: "The Great Gatsby",
    bookCoverImage: "https://images-na.ssl-images-amazon.com/images/I/81af+MCATTL.jpg",
    bookAuthor: "F. Scott Fitzgerald",
    dueDate: "2023-12-01",
    status: "active",
    remainingDays: 5,
    overdueDays: 0

}

const CurrentLoans = () => {
  return (
    <div className='p-6'>

        <h3 className='text-2xl font-bold text-gray-900 mb-6'>
            Books You're Currently Reading
        </h3>

        <div className='space-y-4'>
            {/* List of current loans will go here */}

            {[1, 2, 3, 4].map((item) => (
                <CurrentLoanCard loan={{ ...loan, id: item }} key={item} />
            ))}
        </div>

    </div>
  )
}

export default CurrentLoans
