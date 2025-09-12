// src/utils/loanCalculations.js

// Calculate service fee (2% of amount, minimum 100 KES)
export const calculateServiceFee = (amount) => {
  return Math.max(amount * 0.02, 100);
};

// Generate repayment schedule
export const generateRepaymentSchedule = (principal, durationWeeks) => {
  const weeklyInterestRate = 0.0625; // 6.25% per week
  const weeklyInterest = principal * weeklyInterestRate;
  const schedule = [];
  const today = new Date();
  
  for (let week = 1; week <= durationWeeks; week++) {
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + (week * 7));
    
    schedule.push({
      week,
      due_date: dueDate.toISOString().split('T')[0],
      principal: week === durationWeeks ? principal : 0,
      interest: weeklyInterest,
      total: week === durationWeeks ? principal + weeklyInterest : weeklyInterest
    });
  }
  
  return schedule;
};

// Calculate total repayment amount
export const calculateTotalRepayment = (principal, durationWeeks) => {
  const weeklyInterest = principal * 0.0625;
  return principal + (weeklyInterest * durationWeeks);
};