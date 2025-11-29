import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Home, 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Download, 
  Menu, 
  X,
  Building,
  Briefcase,
  Info,
  ChevronRight,
  ChevronDown,
  Save,
  Plus,
  User,
  CheckCircle,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  BookOpen,
  ArrowRightLeft,
  PieChart
} from 'lucide-react';

// --- Utility Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, type = "neutral" }) => {
  const styles = {
    neutral: "bg-slate-100 text-slate-600",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    primary: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${styles[type]}`}>
      {children}
    </span>
  );
};

const Tooltip = ({ text }) => (
  <div className="group relative inline-block ml-1 align-middle z-50">
    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 cursor-help transition-colors" />
    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg w-56 text-center pointer-events-none shadow-xl font-normal leading-relaxed z-[100]">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, isHidden = false, tooltip = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  if (isHidden) return null;
  
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 hover:bg-slate-50 rounded-lg transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span>{title}</span>
          {tooltip && <div onClick={(e) => e.stopPropagation()}><Tooltip text={tooltip} /></div>}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {isOpen && <div className="pb-4 pt-1 px-1 animate-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  );
};

// --- Chart Components ---

const LineChart = ({ data, lines, height = 300, formatY = (v) => v }) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) return null;

  const padding = { top: 20, right: 30, bottom: 30, left: 60 };
  const width = 1000;
  
  const allValues = data.flatMap(d => lines.map(l => d[l.key]));
  const maxValue = Math.max(...allValues) * 1.1;
  const minValue = Math.min(0, Math.min(...allValues)); 
  
  const getX = (index) => padding.left + (index / (data.length - 1)) * (width - padding.left - padding.right);
  const getY = (value) => height - padding.bottom - ((value - minValue) / (maxValue - minValue)) * (height - padding.top - padding.bottom);

  return (
    <div className="relative w-full overflow-hidden" ref={containerRef} style={{ height: `${height}px` }}>
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full"
        preserveAspectRatio="none"
        onMouseMove={(e) => {
          if(!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const relativeX = (x / rect.width) * width;
          const chartWidth = width - padding.left - padding.right;
          let index = Math.round(((relativeX - padding.left) / chartWidth) * (data.length - 1));
          index = Math.max(0, Math.min(index, data.length - 1));
          setHoverIndex(index);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
          const val = minValue + (maxValue - minValue) * tick;
          const y = getY(val);
          return (
            <g key={tick}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{formatY(val)}</text>
            </g>
          );
        })}
        {minValue < 0 && maxValue > 0 && <line x1={padding.left} y1={getY(0)} x2={width - padding.right} y2={getY(0)} stroke="#94a3b8" strokeWidth="1" />}
        {lines.map((line) => {
          const pathD = data.map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(d[line.key])}`).join(' ');
          return (
            <g key={line.key}>
              {!line.dashed && <path d={`${pathD} L ${getX(data.length - 1)} ${getY(0)} L ${padding.left} ${getY(0)} Z`} fill={line.color} fillOpacity="0.05" />}
              <path d={pathD} fill="none" stroke={line.color} strokeWidth="2.5" strokeDasharray={line.dashed ? "5,5" : "none"} />
            </g>
          );
        })}
        {hoverIndex !== null && (
          <g>
            <line x1={getX(hoverIndex)} y1={padding.top} x2={getX(hoverIndex)} y2={height - padding.bottom} stroke="#94a3b8" strokeWidth="1" />
            {lines.map((line) => (
              <circle key={line.key} cx={getX(hoverIndex)} cy={getY(data[hoverIndex][line.key])} r="5" fill="#fff" stroke={line.color} strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hoverIndex !== null && (
        <div 
          className="absolute bg-white/95 backdrop-blur shadow-xl border border-slate-200 rounded-lg p-3 pointer-events-none z-10 text-xs"
          style={{ left: `${(getX(hoverIndex) / width) * 100}%`, top: '0px', transform: 'translateX(-50%)' }}
        >
          <div className="font-bold text-slate-700 mb-2 border-b pb-1">Year {data[hoverIndex].year}</div>
          {lines.map(line => (
            <div key={line.key} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: line.color }}></div>
                <span className="text-slate-500">{line.label}:</span>
              </div>
              <span className="font-mono font-medium">{formatY(data[hoverIndex][line.key])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let currentAngle = 0;
  const radius = size / 2;
  const center = size / 2;
  const thickness = 20;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {data.map((item, i) => {
          if (item.value <= 0) return null;
          const angle = (item.value / total) * 360;
          const strokeDasharray = `${(item.value / total) * (Math.PI * (radius * 2 - thickness))} ${(Math.PI * (radius * 2 - thickness))}`;
          const strokeDashoffset = -1 * (currentAngle / 360) * (Math.PI * (radius * 2 - thickness));
          currentAngle += angle;
          return <circle key={i} cx={center} cy={center} r={radius - thickness} fill="transparent" stroke={item.color} strokeWidth={thickness} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} className="transition-all duration-500 ease-out" />;
        })}
        <circle cx={center} cy={center} r={radius - thickness * 2} fill="white" />
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {data.map((item, i) => item.value > 0 && (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-slate-500">{item.label}</span>
            <span className="font-semibold text-slate-700 ml-auto">{Math.round((item.value/total)*100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Logic & Constants ---

const INITIAL_STATE = {
  name: "Property A",
  strategy: 'primary',
  simpleMode: true,    
  householdIncome: 120000, 
  price: 450000,
  closingCostsPct: 3,
  downPaymentPct: 20,
  interestRate: 6.5,
  loanTerm: 30,
  extraPayment: 0,
  rent: 2800,
  vacancyRate: 5,
  managementFeePct: 0,
  propertyTaxYearly: 5000,
  insuranceYearly: 1200,
  hoaMonthly: 0,
  maintenancePct: 1, 
  appreciation: 3.5,
  inflation: 2.5,
  yearsToSimulate: 30
};

// Reusable calculation engine
const calculateMetrics = (inputs) => {
    const {
      price, closingCostsPct, downPaymentPct, interestRate, loanTerm, extraPayment,
      rent, vacancyRate, propertyTaxYearly, insuranceYearly, hoaMonthly,
      maintenancePct, managementFeePct, appreciation, inflation, yearsToSimulate,
      strategy, householdIncome
    } = inputs;

    const downPayment = price * (downPaymentPct / 100);
    const closingCosts = price * (closingCostsPct / 100);
    const initialInvestment = downPayment + closingCosts;
    const loanAmount = price - downPayment;
    
    const monthlyRate = (interestRate / 100) / 12;
    const numPayments = loanTerm * 12;
    let monthlyPI = interestRate > 0 ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1) : loanAmount / numPayments;

    const monthlyTax = propertyTaxYearly / 12;
    const monthlyIns = insuranceYearly / 12;
    const monthlyHOA = hoaMonthly;
    const totalMonthlyPITI = monthlyPI + monthlyTax + monthlyIns + monthlyHOA;
    const monthlyIncome = householdIncome / 12;
    const frontEndDTI = (totalMonthlyPITI / monthlyIncome) * 100;

    let currentVal = price;
    let remainingLoan = loanAmount;
    let currentRent = rent;
    let currentTax = propertyTaxYearly;
    let currentIns = insuranceYearly;
    let currentHOA = hoaMonthly * 12;
    let cumulativeCashFlow = -initialInvestment;
    let cumulativeTotalCost = initialInvestment;
    let cumulativeInterest = 0;
    
    const yearlyData = [];

    for (let year = 1; year <= yearsToSimulate; year++) {
      let interestPaidYear = 0;
      let mortgagePaidYear = 0;

      for (let m = 0; m < 12; m++) {
        if (remainingLoan > 0) {
          const interest = remainingLoan * monthlyRate;
          const principal = monthlyPI - interest;
          const extra = extraPayment;
          let actualPrincipal = principal + extra;
          let actualPayment = monthlyPI + extra;

          if (remainingLoan < actualPrincipal) {
             actualPrincipal = remainingLoan;
             actualPayment = remainingLoan + interest;
          }

          remainingLoan -= actualPrincipal;
          interestPaidYear += interest;
          mortgagePaidYear += actualPayment;
        }
      }
      cumulativeInterest += interestPaidYear;

      const grossPotentialRent = strategy === 'rental' ? currentRent * 12 : 0;
      const vacancyLoss = strategy === 'rental' ? grossPotentialRent * (vacancyRate / 100) : 0;
      const effectiveGrossIncome = grossPotentialRent - vacancyLoss;
      const managementFee = strategy === 'rental' ? effectiveGrossIncome * (managementFeePct / 100) : 0;
      const maintenance = currentVal * (maintenancePct / 100);
      const totalOperatingExpenses = currentTax + currentIns + currentHOA + maintenance + managementFee;
      
      const noi = effectiveGrossIncome - totalOperatingExpenses; 
      const cashFlow = noi - mortgagePaidYear; 

      cumulativeCashFlow += cashFlow;
      cumulativeTotalCost += (-cashFlow);

      const equity = currentVal - Math.max(0, remainingLoan);

      yearlyData.push({
        year,
        propertyValue: currentVal,
        loanBalance: Math.max(0, remainingLoan),
        equity,
        grossIncome: effectiveGrossIncome,
        operatingExpenses: totalOperatingExpenses,
        noi,
        debtService: mortgagePaidYear,
        cashFlow,
        cumulativeCashFlow,
        cumulativeTotalCost,
        totalInterest: cumulativeInterest,
        breakdowns: {
          tax: currentTax,
          insurance: currentIns,
          hoa: currentHOA,
          maintenance,
          management: managementFee,
          vacancy: vacancyLoss,
          mortgage: mortgagePaidYear
        }
      });

      currentVal = currentVal * (1 + (appreciation / 100));
      currentRent = currentRent * (1 + (inflation / 100));
      currentTax = currentTax * (1 + (inflation / 100));
      currentIns = currentIns * (1 + (inflation / 100));
      currentHOA = currentHOA * (1 + (inflation / 100));
    }

    const endData = yearlyData[yearlyData.length - 1];
    const totalProfit = endData.equity + endData.cumulativeCashFlow;
    const totalROI = (totalProfit - (-initialInvestment)) / initialInvestment * 100;
    
    const y1 = yearlyData[0];
    const capRate = (y1.noi / price) * 100;
    const cashOnCash = (y1.cashFlow / initialInvestment) * 100;
    const dscr = y1.debtService > 0 ? y1.noi / y1.debtService : 0;
    const breakEvenYear = yearlyData.find(d => d.cumulativeCashFlow >= 0)?.year || "N/A";
    const paidOffYear = yearlyData.find(d => d.loanBalance <= 0)?.year || "N/A";

    return {
      monthlyPI,
      totalMonthlyPITI,
      initialInvestment,
      closingCosts,
      downPayment,
      yearlyData,
      endData,
      totalROI,
      paidOffYear,
      metrics: {
        capRate,
        cashOnCash,
        dscr,
        breakEvenYear,
        noi: y1.noi,
        frontEndDTI,
        monthlyIncome
      }
    };
};

const GLOSSARY = [
  { term: "NOI (Net Operating Income)", def: "Total income from the property minus all operating expenses (taxes, insurance, maintenance). It does NOT include mortgage payments." },
  { term: "Cap Rate (Capitalization Rate)", def: "A measure of a property's unleveraged return. Calculated as NOI / Purchase Price. Higher is generally better for returns, but may imply higher risk." },
  { term: "Cash on Cash Return", def: "The annual pre-tax cash flow divided by the total cash invested (Down payment + Closing costs). It tells you how hard your actual cash is working." },
  { term: "DSCR (Debt Service Coverage Ratio)", def: "Net Operating Income divided by the annual debt service (mortgage). Lenders typically want to see a DSCR > 1.25." },
  { term: "DTI (Debt-to-Income)", def: "The percentage of your gross monthly income that goes to paying debts. For mortgages, lenders prefer a 'Front-End' DTI (Housing costs / Income) below 28%." },
  { term: "Equity", def: "The difference between the property's current market value and the remaining loan balance. This is the portion of the property you truly 'own'." },
  { term: "Cash Flow", def: "The net amount of cash moving in or out of the investment after all expenses and mortgage payments." },
];

// --- Main Application ---

export default function RealEstateROIApp() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isHelpOpen, setHelpOpen] = useState(false);
  
  // State for properties
  const [inputsA, setInputsA] = useState(INITIAL_STATE);
  const [inputsB, setInputsB] = useState({ ...INITIAL_STATE, name: "Property B", price: 350000, rent: 2200 });
  const [scenarios, setScenarios] = useState([]);
  
  // View State
  const [compareMode, setCompareMode] = useState(false);
  const [editingProp, setEditingProp] = useState('A'); // 'A' or 'B'

  useEffect(() => {
    const saved = localStorage.getItem('roiPro_scenarios_v2');
    if (saved) {
      try { setScenarios(JSON.parse(saved)); } catch (e) { console.error("Load failed"); }
    }
  }, []);

  const saveScenario = () => {
    const currentInputs = editingProp === 'A' ? inputsA : inputsB;
    const newScenarios = [...scenarios];
    const existingIndex = newScenarios.findIndex(s => s.name === currentInputs.name);
    if (existingIndex >= 0) newScenarios[existingIndex] = currentInputs;
    else newScenarios.push(currentInputs);
    setScenarios(newScenarios);
    localStorage.setItem('roiPro_scenarios_v2', JSON.stringify(newScenarios));
    alert('Saved!');
  };

  const loadScenario = (scenario) => {
    if (editingProp === 'A') setInputsA({ ...INITIAL_STATE, ...scenario });
    else setInputsB({ ...INITIAL_STATE, ...scenario });
    setSidebarOpen(false);
  };

  const handleInputChange = (key, value) => {
    const setter = editingProp === 'A' ? setInputsA : setInputsB;
    setter(prev => ({ ...prev, [key]: value }));
  };

  const activeInputs = editingProp === 'A' ? inputsA : inputsB;
  const resultsA = useMemo(() => calculateMetrics(inputsA), [inputsA]);
  const resultsB = useMemo(() => calculateMetrics(inputsB), [inputsB]);
  
  const currentResults = editingProp === 'A' ? resultsA : resultsB;

  const downloadCSV = () => {
    const headers = ["Year", "Value", "Loan", "Equity", "Cash Flow", "Cumulative Cash Flow"];
    const rows = currentResults.yearlyData.map(d => [
      d.year, d.propertyValue, d.loanBalance, d.equity, d.cashFlow, d.cumulativeCashFlow
    ].map(v => v.toFixed(2)).join(","));
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `${activeInputs.name}_analysis.csv`;
    link.click();
  };

  const formatMoney = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  const formatPct = (val) => `${Number(val).toFixed(2)}%`;

  // --- Components for Render ---

  const HelpOverlay = () => (
    <div className={`fixed inset-0 z-50 transform transition-transform duration-300 ${isHelpOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={() => setHelpOpen(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              Financial Guide
            </h2>
            <button onClick={() => setHelpOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          <section className="mb-8">
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">About ROI Pro</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              ROI Pro is a comprehensive tool designed to bridge the gap between home affordability analysis and professional real estate investment modeling.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Whether you are buying your first home or analyzing a rental portfolio, this tool allows you to visualize equity growth, cash flow, and affordability over time.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 border-b pb-2 mb-4">Glossary of Terms</h3>
            <div className="space-y-6">
              {GLOSSARY.map((item, idx) => (
                <div key={idx}>
                  <h4 className="font-bold text-blue-700 text-sm mb-1">{item.term}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{item.def}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  const AffordabilityBadge = ({ dti }) => {
    if (dti <= 28) return <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Conservative</span>;
    if (dti <= 36) return <span className="text-amber-500 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Moderate</span>;
    return <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Aggressive</span>;
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <HelpOverlay />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-80 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static
      `}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <Building className="w-7 h-7" />
            <span className="font-bold text-lg tracking-tight">ROI Pro</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Comparison Tabs */}
        {compareMode && (
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setEditingProp('A')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${editingProp === 'A' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Property A
            </button>
            <button 
              onClick={() => setEditingProp('B')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide transition-colors border-b-2 ${editingProp === 'B' ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Property B
            </button>
          </div>
        )}

        {/* Strategy Switcher */}
        <div className="p-4 bg-slate-100 border-b border-slate-200">
           <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <button 
               onClick={() => handleInputChange('strategy', 'primary')}
               className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${activeInputs.strategy === 'primary' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <Home className="w-3 h-3" /> Live In It
             </button>
             <button 
               onClick={() => handleInputChange('strategy', 'rental')}
               className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${activeInputs.strategy === 'rental' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
             >
               <Briefcase className="w-3 h-3" /> Rent It Out
             </button>
           </div>
        </div>

        {/* Inputs Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 space-y-1">
            {/* Input fields bound to activeInputs */}
            {activeInputs.strategy === 'primary' && (
              <CollapsibleSection title="My Income" icon={User} defaultOpen={true} tooltip="Your financial context">
                 <div className="space-y-3">
                   <div>
                      <label className="text-xs text-slate-500 mb-1 flex items-center">
                        Total Household Income (Yearly)
                        <Tooltip text="Combined annual income before taxes. Used to calculate Debt-to-Income (DTI) ratio." />
                      </label>
                      <input type="number" value={activeInputs.householdIncome} onChange={(e) => handleInputChange('householdIncome', Number(e.target.value))} className="w-full input-std" />
                   </div>
                 </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Purchase Price" icon={DollarSign} defaultOpen={true} tooltip="Initial investment details">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 flex items-center">
                    Home Price ($)
                    <Tooltip text="The total agreed-upon purchase price of the property." />
                  </label>
                  <input type="number" step="5000" value={activeInputs.price} onChange={(e) => handleInputChange('price', Number(e.target.value))} className="w-full input-std font-bold text-slate-700" />
                </div>
                {!activeInputs.simpleMode && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center">
                      Closing Costs (%)
                      <Tooltip text="Fees paid at closing (origination fees, title insurance, etc.), typically 2-5% of purchase price." />
                    </label>
                    <input type="number" step="0.5" value={activeInputs.closingCostsPct} onChange={(e) => handleInputChange('closingCostsPct', Number(e.target.value))} className="w-full input-std" />
                  </div>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Mortgage" icon={Briefcase} defaultOpen={true} tooltip="Loan structuring">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 mb-1 flex items-center">
                    Down Payment (%)
                    <Tooltip text="The upfront cash paid towards the home purchase." />
                  </label>
                  <div className="flex items-center gap-2">
                     <input type="range" min="0" max="100" step="1" value={activeInputs.downPaymentPct} onChange={(e) => handleInputChange('downPaymentPct', Number(e.target.value))} className="flex-1 accent-blue-600" />
                     <span className="text-xs font-bold w-10 text-right">{activeInputs.downPaymentPct}%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 flex items-center">
                    Rate (%)
                    <Tooltip text="The annual interest rate on your mortgage loan." />
                  </label>
                  <input type="number" step="0.125" value={activeInputs.interestRate} onChange={(e) => handleInputChange('interestRate', Number(e.target.value))} className="w-full input-std" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 flex items-center">
                    Term (Years)
                    <Tooltip text="The length of time over which the loan is repaid." />
                  </label>
                  <select value={activeInputs.loanTerm} onChange={(e) => handleInputChange('loanTerm', Number(e.target.value))} className="w-full input-std">
                    <option value={15}>15 Years</option>
                    <option value={30}>30 Years</option>
                  </select>
                </div>
              </div>
            </CollapsibleSection>

            {activeInputs.strategy === 'rental' && (
              <CollapsibleSection title="Rental Income" icon={TrendingUp} defaultOpen={true} tooltip="Revenue projections">
                 <div className="space-y-3">
                   <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center">
                      Monthly Rent ($)
                      <Tooltip text="Projected monthly income from tenants." />
                    </label>
                    <input type="number" value={activeInputs.rent} onChange={(e) => handleInputChange('rent', Number(e.target.value))} className="w-full input-std" />
                  </div>
                  {!activeInputs.simpleMode && (
                    <>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 flex items-center">
                          Vacancy Rate (%)
                          <Tooltip text="Percentage of time the property sits empty without rent." />
                        </label>
                        <input type="number" value={activeInputs.vacancyRate} onChange={(e) => handleInputChange('vacancyRate', Number(e.target.value))} className="w-full input-std" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 flex items-center">
                          Mgmt Fee (%)
                          <Tooltip text="Fees paid to a property manager, usually a % of monthly rent." />
                        </label>
                        <input type="number" value={activeInputs.managementFeePct} onChange={(e) => handleInputChange('managementFeePct', Number(e.target.value))} className="w-full input-std" />
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Ongoing Costs" icon={Settings} defaultOpen={!activeInputs.simpleMode} tooltip="Recurring expenses">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center">
                      Tax/Yr ($)
                      <Tooltip text="Annual Property Taxes." />
                    </label>
                    <input type="number" value={activeInputs.propertyTaxYearly} onChange={(e) => handleInputChange('propertyTaxYearly', Number(e.target.value))} className="w-full input-std" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 flex items-center">
                      Ins/Yr ($)
                      <Tooltip text="Annual Homeowners Insurance premium." />
                    </label>
                    <input type="number" value={activeInputs.insuranceYearly} onChange={(e) => handleInputChange('insuranceYearly', Number(e.target.value))} className="w-full input-std" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 flex items-center">
                    HOA/Mo ($)
                    <Tooltip text="Monthly Homeowners Association fees." />
                  </label>
                  <input type="number" value={activeInputs.hoaMonthly} onChange={(e) => handleInputChange('hoaMonthly', Number(e.target.value))} className="w-full input-std" />
                </div>
                <div>
                   <label className="text-xs text-slate-500 mb-1 flex items-center">
                     Maintenance (%)
                     <Tooltip text="Annual budget for repairs/upkeep as a % of property value." />
                   </label>
                   <input type="number" step="0.1" value={activeInputs.maintenancePct} onChange={(e) => handleInputChange('maintenancePct', Number(e.target.value))} className="w-full input-std" />
                </div>
              </div>
            </CollapsibleSection>
            
            <div className="pt-4 px-1">
               <label className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold flex items-center">
                 Timeline
                 <Tooltip text="Number of years to project future value and equity." />
               </label>
               <input type="range" min="5" max="40" step="5" value={activeInputs.yearsToSimulate} onChange={(e) => handleInputChange('yearsToSimulate', Number(e.target.value))} className="w-full accent-blue-600" />
               <div className="flex justify-between text-xs text-slate-500">
                  <span>5 Yrs</span>
                  <span className="font-bold text-blue-600">{activeInputs.yearsToSimulate} Years</span>
                  <span>40 Yrs</span>
               </div>
            </div>
            
            <div className="pt-4 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  Simple Mode
                  <Tooltip text="Hide advanced fields like Vacancy Rates and Management Fees." />
                </span>
                 <button onClick={() => handleInputChange('simpleMode', !activeInputs.simpleMode)} className="text-blue-600">
                 {activeInputs.simpleMode ? <ToggleLeft className="w-8 h-8" /> : <ToggleRight className="w-8 h-8" />}
               </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-800">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                 <h1 className="font-bold text-lg text-slate-800 hidden sm:block">Dashboard</h1>
                 <div className="bg-slate-100 rounded-lg p-1 flex items-center gap-1">
                    <button 
                      onClick={() => setCompareMode(!compareMode)}
                      className={`px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 ${compareMode ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}
                    >
                      <ArrowRightLeft className="w-3 h-3" /> Compare {compareMode ? 'ON' : 'OFF'}
                    </button>
                 </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={downloadCSV} className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => setHelpOpen(true)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
              <HelpCircle className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          
          {/* COMPARISON VIEW */}
          {compareMode ? (
            <div className="space-y-6">
               {/* Comparison KPI Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Purchase Price</h3>
                     <div className="flex justify-between items-end">
                        <div className="text-blue-600 font-bold">{formatMoney(resultsA.initialInvestment)}</div>
                        <div className="text-indigo-600 font-bold">{formatMoney(resultsB.initialInvestment)}</div>
                     </div>
                     <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>Prop A (Cash Needed)</span>
                        <span>Prop B (Cash Needed)</span>
                     </div>
                  </Card>
                  <Card className="p-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Monthly Cash Flow</h3>
                     <div className="flex justify-between items-end">
                        <div className={`font-bold ${resultsA.yearlyData[0].cashFlow >= 0 ? 'text-blue-600' : 'text-red-500'}`}>{formatMoney(resultsA.yearlyData[0].cashFlow/12)}</div>
                        <div className={`font-bold ${resultsB.yearlyData[0].cashFlow >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>{formatMoney(resultsB.yearlyData[0].cashFlow/12)}</div>
                     </div>
                  </Card>
                  <Card className="p-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cap Rate</h3>
                     <div className="flex justify-between items-end">
                        <div className="text-blue-600 font-bold">{formatPct(resultsA.metrics.capRate)}</div>
                        <div className="text-indigo-600 font-bold">{formatPct(resultsB.metrics.capRate)}</div>
                     </div>
                  </Card>
                   <Card className="p-4">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Equity (Yr {inputsA.yearsToSimulate})</h3>
                     <div className="flex justify-between items-end">
                        <div className="text-blue-600 font-bold">{formatMoney(resultsA.endData.equity)}</div>
                        <div className="text-indigo-600 font-bold">{formatMoney(resultsB.endData.equity)}</div>
                     </div>
                  </Card>
               </div>

               {/* Comparison Charts */}
               <Card className="p-6">
                  <h3 className="font-bold text-slate-700 mb-4">Equity Comparison</h3>
                  <LineChart 
                      data={resultsA.yearlyData.map((d, i) => ({ ...d, equityB: resultsB.yearlyData[i]?.equity || 0 }))} 
                      lines={[
                        { key: 'equity', color: '#2563eb', label: 'Prop A Equity' },
                        { key: 'equityB', color: '#4f46e5', label: 'Prop B Equity', dashed: true }
                      ]}
                      formatY={(v) => `$${(v/1000).toFixed(0)}k`}
                   />
               </Card>
            </div>
          ) : (
            // SINGLE VIEW
            <div className="space-y-6">
              {activeInputs.strategy === 'primary' ? (
                 <>
                   {/* Affordability Banner */}
                  <Card className="p-6 border-l-4 border-l-blue-600 relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Payment</h3>
                          <div className="text-4xl font-bold text-slate-800">{formatMoney(currentResults.totalMonthlyPITI)}</div>
                          <p className="text-xs text-slate-500 mt-1">Includes Mortgage, Tax, Insurance & HOA</p>
                      </div>
                      
                      <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Can I afford this?</h3>
                          <div className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                            {currentResults.metrics.frontEndDTI.toFixed(1)}% DTI
                          </div>
                          <div className="mt-1 text-sm"><AffordabilityBadge dti={currentResults.metrics.frontEndDTI} /></div>
                      </div>

                      <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Cash Needed</h3>
                          <div className="text-2xl font-bold text-slate-700">{formatMoney(currentResults.initialInvestment)}</div>
                          <p className="text-xs text-slate-500 mt-1">Down Payment + Closing Costs</p>
                      </div>
                    </div>
                  </Card>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                       <h3 className="font-bold text-slate-700 mb-4">Monthly Cost Breakdown</h3>
                       <div className="flex justify-center py-4">
                         <DonutChart 
                           size={200} 
                           data={[
                              { label: 'Principal', value: currentResults.monthlyPI - (currentResults.yearlyData[0].totalInterest/12), color: '#10b981' },
                              { label: 'Interest', value: currentResults.yearlyData[0].totalInterest/12, color: '#f59e0b' },
                              { label: 'Tax/Ins/HOA', value: currentResults.yearlyData[0].breakdowns.tax/12 + currentResults.yearlyData[0].breakdowns.insurance/12 + currentResults.yearlyData[0].breakdowns.hoa/12, color: '#64748b' }
                           ]}
                         />
                       </div>
                    </Card>
                    <Card className="p-6">
                      <h3 className="font-bold text-slate-700 mb-4">Equity Projection</h3>
                      <LineChart 
                          data={currentResults.yearlyData} 
                          lines={[
                            { key: 'equity', color: '#10b981', label: 'Home Equity' },
                            { key: 'loanBalance', color: '#cbd5e1', label: 'Loan Balance' }
                          ]}
                          formatY={(v) => `$${(v/1000).toFixed(0)}k`}
                      />
                    </Card>
                   </div>
                 </>
              ) : (
                // RENTAL VIEW
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 border-t-4 border-t-emerald-500">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Cash Flow / Mo</h3>
                      <div className={`text-2xl font-bold ${currentResults.yearlyData[0].cashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatMoney(currentResults.yearlyData[0].cashFlow / 12)}
                      </div>
                    </Card>
                    <Card className="p-4 border-t-4 border-t-blue-500">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Cash on Cash</h3>
                      <div className="text-2xl font-bold text-blue-600">{formatPct(currentResults.metrics.cashOnCash)}</div>
                    </Card>
                    <Card className="p-4 border-t-4 border-t-violet-500">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Cap Rate</h3>
                      <div className="text-2xl font-bold text-violet-600">{formatPct(currentResults.metrics.capRate)}</div>
                    </Card>
                    <Card className="p-4 border-t-4 border-t-amber-500">
                      <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Total ROI</h3>
                      <div className="text-2xl font-bold text-amber-600">{currentResults.totalROI.toFixed(0)}%</div>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card className="p-6 xl:col-span-2">
                        <h3 className="font-bold text-slate-700 mb-2">Profit vs Equity</h3>
                        <LineChart 
                          data={currentResults.yearlyData} 
                          lines={[
                            { key: 'cumulativeCashFlow', color: '#3b82f6', label: 'Total Cash Profit' },
                            { key: 'equity', color: '#10b981', label: 'Property Equity' }
                          ]}
                          formatY={(v) => `$${(v/1000).toFixed(0)}k`}
                        />
                    </Card>
                    <Card className="p-6">
                      <h3 className="font-bold text-slate-700 mb-2">Operating Expenses</h3>
                      <div className="flex justify-center py-6">
                        <DonutChart 
                           size={180}
                           data={[
                              { label: 'Mortgage', value: currentResults.yearlyData[0].breakdowns.mortgage, color: '#6366f1' },
                              { label: 'Taxes', value: currentResults.yearlyData[0].breakdowns.tax, color: '#f59e0b' },
                              { label: 'Maint', value: currentResults.yearlyData[0].breakdowns.maintenance, color: '#ef4444' },
                              { label: 'Other', value: currentResults.yearlyData[0].breakdowns.insurance + currentResults.yearlyData[0].breakdowns.hoa + currentResults.yearlyData[0].breakdowns.management, color: '#cbd5e1' }
                           ]}
                        />
                      </div>
                      <div className="text-center">
                         <p className="text-sm font-bold text-slate-700">NOI: {formatMoney(currentResults.metrics.noi)}/yr</p>
                         <p className="text-xs text-slate-400">Net Operating Income</p>
                      </div>
                   </Card>
                  </div>
                </>
              )}
              
               {/* Detailed Data Table */}
               <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 text-sm">Yearly Projections</h3>
                  <span className="text-xs text-slate-400 italic">Scroll for more →</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-white text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">Year</th>
                        <th className="px-6 py-3">Home Value</th>
                        <th className="px-6 py-3">Loan Balance</th>
                        <th className="px-6 py-3 text-emerald-600">Equity</th>
                        <th className="px-6 py-3">Total Paid</th>
                        {activeInputs.strategy === 'rental' && <th className="px-6 py-3 text-blue-600">Cash Flow</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {currentResults.yearlyData.map((row) => (
                        <tr key={row.year} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 font-bold text-slate-700">{row.year}</td>
                          <td className="px-6 py-3 text-slate-600">{formatMoney(row.propertyValue)}</td>
                          <td className="px-6 py-3 text-slate-400">{formatMoney(row.loanBalance)}</td>
                          <td className="px-6 py-3 font-bold text-emerald-600">{formatMoney(row.equity)}</td>
                          <td className="px-6 py-3 text-slate-500">{formatMoney(row.cumulativeTotalCost)}</td>
                          {activeInputs.strategy === 'rental' && (
                            <td className={`px-6 py-3 font-bold ${row.cashFlow >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                               {formatMoney(row.cashFlow)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <style>{`
        .input-std {
          @apply w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none shadow-sm;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}