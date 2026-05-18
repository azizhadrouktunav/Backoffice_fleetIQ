const fs = require('fs');
const p = 'src/pages/ClientsPage.tsx';
let s = fs.readFileSync(p, 'utf8');

if (s.includes('ClientsFilterBar')) {
  console.log('already patched');
  process.exit(0);
}

const start = s.indexOf(
  '        <motion.div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">'
    .replace('motion.', '')
);
const end = s.indexOf('        <motion.div className="overflow-x-auto">'.replace('motion.', ''));

const newBlock = `        <ClientsFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          expiryFilterEnabled={expiryFilterEnabled}
          onExpiryFilterEnabledChange={setExpiryFilterEnabled}
          periodFilter={periodFilter}
          onPeriodChange={setPeriodFilter}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          activeFilterCount={activeFilterCount}
          hasActiveFilters={hasActiveFilters}
          onReset={resetFilters}
          filteredCount={filteredClients.length}
          totalCount={visibleClients.length}
        />

`;

if (start === -1 || end === -1) {
  console.log('markers not found', start, end);
  process.exit(1);
}

s = s.slice(0, start) + newBlock + s.slice(end);
fs.writeFileSync(p, s);
console.log('patched');
