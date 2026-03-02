const fs = require('fs');
const path = require('path');

const generateReturns = (count) => {
    const returns = [];
    const returnTypes = ['GSTR-1', 'GSTR-3B', 'CMP-08', 'ITC-04'];
    const statuses = ['Pending', 'Filed', 'Overdue'];
    const clientNames = ['Acme Corp', 'Global Industries', 'Stark Enterprises', 'Wayne Tech', 'Umbrella Corp', 'Cyberdyne Systems', 'LexCorp', 'Oscorp', 'Massive Dynamic'];
    const staffIds = ['admin-1', 'staff-1', 'staff-2', undefined]; // match staff.json IDs loosely, some unassigned

    for (let i = 1; i <= count; i++) {
        const isOverdue = Math.random() < 0.2; // 20% chance of overdue
        const isFiled = Math.random() < 0.4;
        const status = isOverdue ? 'Overdue' : isFiled ? 'Filed' : 'Pending';

        // Random date in past or future
        const offsetDays = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + offsetDays);

        returns.push({
            id: `RET-${10000 + i}`,
            clientId: `CLI-${Math.floor(Math.random() * 100) + 1}`,
            clientName: clientNames[Math.floor(Math.random() * clientNames.length)] + ` ${Math.floor(Math.random() * 100)}`,
            period: `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
            type: returnTypes[Math.floor(Math.random() * returnTypes.length)],
            status: status,
            dueDate: dueDate.toISOString().split('T')[0],
            assignedTo: staffIds[Math.floor(Math.random() * staffIds.length)]
        });
    }
    return returns;
};

const data = generateReturns(5500);
const targetPath = path.join(__dirname, 'src', 'assets', 'mock-data', 'returns.json');

fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
console.log(`Successfully generated ${data.length} returns to ${targetPath}`);
