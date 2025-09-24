<!--
  Payroll Wizard - Transparent salary calculation workflow
  Step-by-step salary calculation with detailed explanations
-->
<script>
  import { employees, attendance, config, currentPeriod, salaryRecords } from '../stores.js';
  import { calculateSalaryRecord, calculateDailyRate, calculateHourlyRate, formatCurrency } from '../core.js';
  import { storage, storeSalaryRecord, getSalaryRecord } from '../stores.js';
  import { toasts } from '../lib/toast.js';
  import Wizard from './Wizard.svelte';
  import Icon from '@iconify/svelte';
  import { ICONS } from '../lib/icons.js';
  
  let currentStep = $state(0);
  let selectedPeriod = $state({ year: $currentPeriod.year, month: $currentPeriod.month });
  let selectedEmployee = $state('');
  let viewMode = $state('overview'); // 'overview' | 'calculate' | 'detailed'
  let calculationData = $state(null);
  
  // Generate available periods (last 12 months)
  const availablePeriods = (() => {
    const periods = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      periods.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    return periods;
  })();
  
  // Get month key for attendance storage
  const getMonthKey = (year, month) => `${year}-${String(month).padStart(2, '0')}`;
  
  // Get attendance for specific employee and period
  const getEmployeeAttendance = (employeeId) => {
    const monthKey = getMonthKey(selectedPeriod.year, selectedPeriod.month);
    return $attendance[employeeId]?.[monthKey] || {};
  };
  
  // Get adjustments for employee
  const getAdjustments = (employeeId) => {
    return storage.getAdjustments(employeeId) || [];
  };
  
  // Calculate detailed salary breakdown for an employee
  const calculateDetailedSalary = (employee) => {
    const monthAttendance = getEmployeeAttendance(employee.id);
    const adjustments = getAdjustments(employee.id);
    
    const salaryRecord = calculateSalaryRecord(employee, monthAttendance, adjustments, $config);
    
    // Add step-by-step calculation details
    const dailyRate = calculateDailyRate(employee.monthlySalary, $config.workingDaysPerMonth);
    const hourlyRate = calculateHourlyRate(employee.monthlySalary, $config);
    
    const calculationSteps = [
      {
        step: 1,
        title: 'Base Salary Calculation',
        description: 'Calculate base salary from hours worked',
        formula: 'Hours Worked × Hourly Rate',
        calculation: `${salaryRecord.period.hours} hours × ${formatCurrency(hourlyRate)}`,
        result: salaryRecord.components.basicSalary,
        details: {
          hoursWorked: salaryRecord.period.hours,
          hourlyRate,
          monthlySalary: employee.monthlySalary,
          workingDaysPerMonth: $config.workingDaysPerMonth,
          workdayHours: $config.workdayHours,
          dailyRate
        }
      },
      {
        step: 2,
        title: 'Bonus Calculations',
        description: 'Add all applicable bonuses',
        formula: 'Daily Rate Bonuses + Fixed Amount Bonuses',
        calculation: getBonusCalculationText(employee, dailyRate),
        result: salaryRecord.components.bonusE + salaryRecord.components.bonusS + 
               salaryRecord.components.bonusK + salaryRecord.components.bonusM + 
               salaryRecord.components.bonusT,
        details: {
          bonusE: { amount: salaryRecord.components.bonusE, calculation: `${$config.bonuses.E.value} × ${formatCurrency(dailyRate)}` },
          bonusS: { amount: salaryRecord.components.bonusS, calculation: `${$config.bonuses.S.value} × ${formatCurrency(dailyRate)}` },
          bonusK: { amount: salaryRecord.components.bonusK, calculation: `Fixed ${formatCurrency($config.bonuses.K.value)}` },
          bonusM: { amount: salaryRecord.components.bonusM, calculation: `Fixed ${formatCurrency($config.bonuses.M.value)}` },
          bonusT: { amount: salaryRecord.components.bonusT, calculation: employee.maritalStatus === 'married' ? `Fixed ${formatCurrency($config.bonuses.T.value)} (Married)` : 'Not applicable (Single)' }
        }
      },
      {
        step: 3,
        title: 'Manual Adjustments',
        description: 'Add positive/negative adjustments',
        formula: 'Sum of all adjustments',
        calculation: adjustments.length > 0 ? adjustments.map(adj => `${adj.amount >= 0 ? '+' : ''}${formatCurrency(adj.amount)}`).join(' + ') : 'No adjustments',
        result: salaryRecord.components.adjustmentTotal,
        details: {
          adjustments: adjustments
        }
      },
      {
        step: 4,
        title: 'Subtotal Before Deductions',
        description: 'Sum of base salary, bonuses, and adjustments',
        formula: 'Base + Bonuses + Adjustments',
        calculation: `${formatCurrency(salaryRecord.components.basicSalary)} + ${formatCurrency(salaryRecord.components.bonusE + salaryRecord.components.bonusS + salaryRecord.components.bonusK + salaryRecord.components.bonusM + salaryRecord.components.bonusT)} + ${formatCurrency(salaryRecord.components.adjustmentTotal)}`,
        result: salaryRecord.subtotal,
        details: {
          basicSalary: salaryRecord.components.basicSalary,
          totalBonuses: salaryRecord.components.bonusE + salaryRecord.components.bonusS + salaryRecord.components.bonusK + salaryRecord.components.bonusM + salaryRecord.components.bonusT,
          adjustments: salaryRecord.components.adjustmentTotal
        }
      },
      {
        step: 5,
        title: 'Insurance Deduction',
        description: 'Apply insurance deduction percentage',
        formula: 'Subtotal × Insurance Rate',
        calculation: `${formatCurrency(salaryRecord.subtotal)} × ${($config.deductions.insurance.value * 100).toFixed(1)}%`,
        result: salaryRecord.components.insuranceDeduction,
        details: {
          subtotal: salaryRecord.subtotal,
          rate: $config.deductions.insurance.value,
          percentage: ($config.deductions.insurance.value * 100).toFixed(1)
        }
      },
      {
        step: 6,
        title: 'Final Salary',
        description: 'Subtract deductions from subtotal',
        formula: 'Subtotal - Insurance Deduction',
        calculation: `${formatCurrency(salaryRecord.subtotal)} - ${formatCurrency(salaryRecord.components.insuranceDeduction)}`,
        result: salaryRecord.finalSalary,
        details: {
          subtotal: salaryRecord.subtotal,
          deduction: salaryRecord.components.insuranceDeduction
        }
      }
    ];
    
    return {
      ...salaryRecord,
      calculationSteps,
      employee
    };
  };
  
  const getBonusCalculationText = (employee, dailyRate) => {
    const parts = [];
    
    // Bonus E
    if ($config.bonuses.E.value > 0) {
      parts.push(`E: ${$config.bonuses.E.value} × ${formatCurrency(dailyRate)}`);
    }
    
    // Bonus S
    if ($config.bonuses.S.value > 0) {
      parts.push(`S: ${$config.bonuses.S.value} × ${formatCurrency(dailyRate)}`);
    }
    
    // Fixed bonuses
    if ($config.bonuses.K.value > 0) {
      parts.push(`K: ${formatCurrency($config.bonuses.K.value)}`);
    }
    
    if ($config.bonuses.M.value > 0) {
      parts.push(`M: ${formatCurrency($config.bonuses.M.value)}`);
    }
    
    if (employee.maritalStatus === 'married' && $config.bonuses.T.value > 0) {
      parts.push(`T: ${formatCurrency($config.bonuses.T.value)}`);
    }
    
    return parts.join(' + ');
  };
  
  // Get payroll overview for all employees
  const getPayrollOverview = () => {
    return $employees.map(employee => {
      const existingRecord = getSalaryRecord(employee.id, selectedPeriod.year, selectedPeriod.month);
      
      if (existingRecord) {
        return {
          employee,
          salary: existingRecord,
          hasRecord: true
        };
      } else {
        // Calculate on-the-fly for preview
        const monthAttendance = getEmployeeAttendance(employee.id);
        const adjustments = getAdjustments(employee.id);
        const salary = calculateSalaryRecord(employee, monthAttendance, adjustments, $config);
        
        return {
          employee,
          salary,
          hasRecord: false
        };
      }
    });
  };
  
  const payrollOverview = $derived(getPayrollOverview());
  
  // Wizard steps
  const getSteps = () => {
    if (viewMode === 'overview') {
      return [
        {
          title: 'Payroll Overview',
          description: 'Review salary calculations for all employees',
          icon: ICONS.chart
        }
      ];
    } else if (viewMode === 'calculate') {
      return [
        {
          title: 'Select Employee',
          description: 'Choose employee for detailed calculation',
          icon: ICONS.user
        },
        {
          title: 'Base Salary',
          description: 'Calculate base salary from attendance',
          icon: ICONS.clock
        },
        {
          title: 'Bonuses',
          description: 'Apply bonus calculations',
          icon: ICONS.gift
        },
        {
          title: 'Adjustments',
          description: 'Add manual adjustments',
          icon: ICONS.plus
        },
        {
          title: 'Deductions',
          description: 'Apply insurance deduction',
          icon: ICONS.percent
        },
        {
          title: 'Final Result',
          description: 'Review and save calculation',
          icon: ICONS.check
        }
      ];
    }
    
    return [];
  };
  
  const steps = $derived(getSteps());
  
  const startCalculation = (employeeId = '') => {
    viewMode = 'calculate';
    currentStep = 0;
    selectedEmployee = employeeId;
    calculationData = null;
  };
  
  const backToOverview = () => {
    viewMode = 'overview';
    currentStep = 0;
    selectedEmployee = '';
    calculationData = null;
  };
  
  const canProceedToNext = $derived(() => {
    if (viewMode === 'calculate' && currentStep === 0) {
      return selectedEmployee !== '';
    }
    return true;
  });
  
  const proceedToNextStep = () => {
    if (viewMode === 'calculate' && currentStep === 0) {
      // Calculate detailed salary when proceeding from employee selection
      const employee = $employees.find(emp => emp.id === selectedEmployee);
      if (employee) {
        calculationData = calculateDetailedSalary(employee);
      }
    }
  };
  
  const saveCalculation = () => {
    if (calculationData) {
      storeSalaryRecord(
        calculationData.employee.id,
        selectedPeriod.year,
        selectedPeriod.month,
        calculationData
      );
      
      toasts.success('Salary calculation saved successfully!');
      backToOverview();
    }
  };
  
  const recalculateAll = () => {
    $employees.forEach(employee => {
      const monthAttendance = getEmployeeAttendance(employee.id);
      const adjustments = getAdjustments(employee.id);
      const salaryRecord = calculateSalaryRecord(employee, monthAttendance, adjustments, $config);
      
      storeSalaryRecord(employee.id, selectedPeriod.year, selectedPeriod.month, salaryRecord);
    });
    
    toasts.success('All salary calculations updated!');
  };
  
  // Get total payroll
  const totalPayroll = $derived(
    payrollOverview.reduce((sum, item) => sum + item.salary.finalSalary, 0)
  );
</script>

<Wizard 
  {steps}
  bind:currentStep
  title="Payroll Calculation"
  description="Calculate salaries with full transparency"
  canGoNext={canProceedToNext}
  onNext={proceedToNextStep}
  onComplete={viewMode === 'calculate' ? saveCalculation : () => {}}
>
  {#snippet children(stepIndex, stepData)}
    
    <!-- Overview Mode -->
    {#if viewMode === 'overview'}
      <div class="payroll-overview">
        <div class="overview-header">
          <div class="period-selector">
            <label for="period">
              <Icon icon={ICONS.calendar} width="1.25rem" height="1.25rem" />
              Period
            </label>
            <select id="period" bind:value={selectedPeriod}>
              {#each availablePeriods as period}
                <option value={period}>
                  {period.label}
                </option>
              {/each}
            </select>
          </div>
          
          <div class="action-buttons">
            <button class="secondary" onclick={recalculateAll}>
              <Icon icon={ICONS.refresh} width="1.25rem" height="1.25rem" />
              Recalculate All
            </button>
            <button class="primary" onclick={() => startCalculation()}>
              <Icon icon={ICONS.calculator} width="1.25rem" height="1.25rem" />
              Calculate Salary
            </button>
          </div>
        </div>
        
        <div class="payroll-summary">
          <div class="summary-card total-card">
            <Icon icon={ICONS.wadMoney} width="3rem" height="3rem" />
            <div>
              <h3>Total Payroll</h3>
              <div class="total-amount">{formatCurrency(totalPayroll)}</div>
              <div class="employee-count">{$employees.length} employees</div>
            </div>
          </div>
          
          <div class="summary-stats">
            <div class="stat-item">
              <Icon icon={ICONS.users} width="2rem" height="2rem" />
              <div>
                <span class="stat-value">{payrollOverview.filter(item => item.hasRecord).length}</span>
                <span class="stat-label">Calculated</span>
              </div>
            </div>
            
            <div class="stat-item">
              <Icon icon={ICONS.clock} width="2rem" height="2rem" />
              <div>
                <span class="stat-value">{payrollOverview.reduce((sum, item) => sum + (item.salary.period?.hours || 0), 0).toFixed(1)}</span>
                <span class="stat-label">Total Hours</span>
              </div>
            </div>
            
            <div class="stat-item">
              <Icon icon={ICONS.gift} width="2rem" height="2rem" />
              <div>
                <span class="stat-value">{formatCurrency(payrollOverview.reduce((sum, item) => sum + (item.salary.components?.bonusK || 0) + (item.salary.components?.bonusM || 0) + (item.salary.components?.bonusT || 0), 0))}</span>
                <span class="stat-label">Fixed Bonuses</span>
              </div>
            </div>
          </div>
        </div>
        
        {#if $employees.length === 0}
          <div class="empty-state">
            <Icon icon={ICONS.users} width="4rem" height="4rem" />
            <h4>No Employees Added</h4>
            <p>Add employees first before calculating payroll.</p>
          </div>
        {:else}
          <div class="employees-payroll-grid">
            {#each payrollOverview as item (item.employee.id)}
              <div class="employee-payroll-card" class:calculated={item.hasRecord}>
                <div class="employee-header">
                  <div class="employee-info">
                    <Icon icon={item.employee.gender === 'male' ? ICONS.male : ICONS.female} width="2rem" height="2rem" />
                    <div>
                      <h4>{item.employee.name}</h4>
                      <div class="employee-meta">
                        <span class="base-salary">{formatCurrency(item.employee.monthlySalary)} base</span>
                        {#if item.hasRecord}
                          <span class="calculated-badge">
                            <Icon icon={ICONS.check} width="1rem" height="1rem" />
                            Calculated
                          </span>
                        {:else}
                          <span class="preview-badge">
                            <Icon icon={ICONS.clock} width="1rem" height="1rem" />
                            Preview
                          </span>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <button class="secondary" onclick={() => startCalculation(item.employee.id)}>
                    <Icon icon={ICONS.calculator} width="1rem" height="1rem" />
                    {item.hasRecord ? 'Review' : 'Calculate'}
                  </button>
                </div>
                
                <div class="salary-breakdown">
                  <div class="breakdown-row main-row">
                    <span class="label">Final Salary</span>
                    <span class="value final">{formatCurrency(item.salary.finalSalary)}</span>
                  </div>
                  
                  <div class="breakdown-details">
                    <div class="breakdown-row">
                      <span class="sub-label">Base Salary</span>
                      <span class="sub-value">{formatCurrency(item.salary.components?.basicSalary || 0)}</span>
                    </div>
                    
                    <div class="breakdown-row">
                      <span class="sub-label">Total Bonuses</span>
                      <span class="sub-value">+{formatCurrency(
                        (item.salary.components?.bonusE || 0) + 
                        (item.salary.components?.bonusS || 0) + 
                        (item.salary.components?.bonusK || 0) + 
                        (item.salary.components?.bonusM || 0) + 
                        (item.salary.components?.bonusT || 0)
                      )}</span>
                    </div>
                    
                    {#if item.salary.components?.adjustmentTotal !== 0}
                      <div class="breakdown-row">
                        <span class="sub-label">Adjustments</span>
                        <span class="sub-value" class:negative={item.salary.components.adjustmentTotal < 0}>
                          {item.salary.components.adjustmentTotal >= 0 ? '+' : ''}{formatCurrency(item.salary.components.adjustmentTotal)}
                        </span>
                      </div>
                    {/if}
                    
                    <div class="breakdown-row">
                      <span class="sub-label">Insurance</span>
                      <span class="sub-value negative">-{formatCurrency(item.salary.components?.insuranceDeduction || 0)}</span>
                    </div>
                  </div>
                  
                  <div class="period-info">
                    <span>{item.salary.period?.hours || 0} hours • {item.salary.period?.workdays || 0} days</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    
    <!-- Calculation Mode -->
    {:else if viewMode === 'calculate'}
      
      <!-- Step 1: Select Employee -->
      {#if stepIndex === 0}
        <div class="select-employee-step">
          <h3>
            <Icon icon={ICONS.user} width="1.5rem" height="1.5rem" />
            Select Employee for Calculation
          </h3>
          
          <div class="employee-selection-grid">
            {#each $employees as employee (employee.id)}
              <button 
                class="employee-selection-card"
                class:selected={selectedEmployee === employee.id}
                onclick={() => selectedEmployee = employee.id}
              >
                <Icon icon={employee.gender === 'male' ? ICONS.male : ICONS.female} width="2.5rem" height="2.5rem" />
                <div>
                  <h4>{employee.name}</h4>
                  <div class="employee-details">
                    <span class="base-salary">{formatCurrency(employee.monthlySalary)} monthly</span>
                    <span class="employee-attrs">{employee.maritalStatus} • {employee.gender}</span>
                  </div>
                </div>
                
                {#if selectedEmployee === employee.id}
                  <Icon icon={ICONS.check} width="1.5rem" height="1.5rem" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      
      <!-- Steps 2-6: Calculation Steps -->
      {:else if calculationData}
        {@const currentCalculationStep = calculationData.calculationSteps[stepIndex - 1]}
        
        <div class="calculation-step">
          <div class="step-header">
            <div class="step-badge">
              <Icon icon={ICONS.calculator} width="1.5rem" height="1.5rem" />
              Step {currentCalculationStep.step}
            </div>
            <h3>{currentCalculationStep.title}</h3>
            <p>{currentCalculationStep.description}</p>
          </div>
          
          <div class="calculation-explanation">
            <div class="formula-card">
              <h4>
                <Icon icon={ICONS.info} width="1.25rem" height="1.25rem" />
                Formula
              </h4>
              <div class="formula">{currentCalculationStep.formula}</div>
            </div>
            
            <div class="calculation-card">
              <h4>
                <Icon icon={ICONS.calculator} width="1.25rem" height="1.25rem" />
                Calculation
              </h4>
              <div class="calculation">{currentCalculationStep.calculation}</div>
            </div>
            
            <div class="result-card">
              <h4>
                <Icon icon={ICONS.check} width="1.25rem" height="1.25rem" />
                Result
              </h4>
              <div class="result">{formatCurrency(currentCalculationStep.result)}</div>
            </div>
          </div>
          
          <!-- Step-specific details -->
          {#if stepIndex === 1}
            <!-- Base Salary Details -->
            <div class="step-details">
              <h4>Base Salary Breakdown</h4>
              <div class="details-grid">
                <div class="detail-item">
                  <span class="detail-label">Monthly Salary</span>
                  <span class="detail-value">{formatCurrency(currentCalculationStep.details.monthlySalary)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Working Days/Month</span>
                  <span class="detail-value">{currentCalculationStep.details.workingDaysPerMonth} days</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Daily Rate</span>
                  <span class="detail-value">{formatCurrency(currentCalculationStep.details.dailyRate)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Working Hours/Day</span>
                  <span class="detail-value">{currentCalculationStep.details.workdayHours} hours</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Hourly Rate</span>
                  <span class="detail-value">{formatCurrency(currentCalculationStep.details.hourlyRate)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Hours Worked</span>
                  <span class="detail-value">{currentCalculationStep.details.hoursWorked} hours</span>
                </div>
              </div>
            </div>
          
          {:else if stepIndex === 2}
            <!-- Bonus Details -->
            <div class="step-details">
              <h4>Bonus Breakdown</h4>
              <div class="bonus-grid">
                {#each Object.entries(currentCalculationStep.details) as [key, bonus]}
                  {#if bonus.amount > 0}
                    <div class="bonus-item">
                      <div class="bonus-header">
                        <Icon icon={ICONS.gift} width="1.25rem" height="1.25rem" />
                        <span class="bonus-name">{key.replace('bonus', 'Bonus ')}</span>
                      </div>
                      <div class="bonus-calculation">{bonus.calculation}</div>
                      <div class="bonus-amount">{formatCurrency(bonus.amount)}</div>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          
          {:else if stepIndex === 3}
            <!-- Adjustments Details -->
            <div class="step-details">
              <h4>Manual Adjustments</h4>
              {#if currentCalculationStep.details.adjustments.length > 0}
                <div class="adjustments-list">
                  {#each currentCalculationStep.details.adjustments as adjustment}
                    <div class="adjustment-item">
                      <div class="adjustment-amount" class:negative={adjustment.amount < 0}>
                        {adjustment.amount >= 0 ? '+' : ''}{formatCurrency(adjustment.amount)}
                      </div>
                      <div class="adjustment-comment">
                        {adjustment.comment || 'No comment'}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="no-adjustments">
                  <Icon icon={ICONS.info} width="2rem" height="2rem" />
                  <span>No manual adjustments for this employee</span>
                </div>
              {/if}
            </div>
          
          {:else if stepIndex === 4}
            <!-- Subtotal Details -->
            <div class="step-details">
              <h4>Subtotal Components</h4>
              <div class="subtotal-breakdown">
                <div class="subtotal-item">
                  <span class="component-label">Base Salary</span>
                  <span class="component-value">{formatCurrency(currentCalculationStep.details.basicSalary)}</span>
                </div>
                <div class="subtotal-item">
                  <span class="component-label">Total Bonuses</span>
                  <span class="component-value">+{formatCurrency(currentCalculationStep.details.totalBonuses)}</span>
                </div>
                <div class="subtotal-item">
                  <span class="component-label">Adjustments</span>
                  <span class="component-value" class:negative={currentCalculationStep.details.adjustments < 0}>
                    {currentCalculationStep.details.adjustments >= 0 ? '+' : ''}{formatCurrency(currentCalculationStep.details.adjustments)}
                  </span>
                </div>
                <div class="subtotal-item total">
                  <span class="component-label">Subtotal</span>
                  <span class="component-value">{formatCurrency(currentCalculationStep.result)}</span>
                </div>
              </div>
            </div>
          
          {:else if stepIndex === 5}
            <!-- Insurance Deduction Details -->
            <div class="step-details">
              <h4>Insurance Deduction</h4>
              <div class="deduction-breakdown">
                <div class="deduction-item">
                  <span class="detail-label">Subtotal Amount</span>
                  <span class="detail-value">{formatCurrency(currentCalculationStep.details.subtotal)}</span>
                </div>
                <div class="deduction-item">
                  <span class="detail-label">Insurance Rate</span>
                  <span class="detail-value">{currentCalculationStep.details.percentage}%</span>
                </div>
                <div class="deduction-item total">
                  <span class="detail-label">Deduction Amount</span>
                  <span class="detail-value negative">{formatCurrency(currentCalculationStep.result)}</span>
                </div>
              </div>
            </div>
          
          {:else if stepIndex === 6}
            <!-- Final Result -->
            <div class="step-details">
              <h4>Final Salary Summary</h4>
              <div class="final-summary">
                <div class="summary-row">
                  <span class="summary-label">Subtotal Before Deductions</span>
                  <span class="summary-value">{formatCurrency(currentCalculationStep.details.subtotal)}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Insurance Deduction</span>
                  <span class="summary-value negative">-{formatCurrency(currentCalculationStep.details.deduction)}</span>
                </div>
                <div class="summary-row final-row">
                  <span class="summary-label">Final Salary</span>
                  <span class="summary-value final">{formatCurrency(currentCalculationStep.result)}</span>
                </div>
              </div>
              
              <div class="calculation-complete">
                <Icon icon={ICONS.check} width="2rem" height="2rem" />
                <div>
                  <h5>Calculation Complete</h5>
                  <p>Review the final salary amount and click "Complete" to save this calculation.</p>
                </div>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    {/if}
  {/snippet}
</Wizard>

<!-- Back to Overview Button -->
{#if viewMode !== 'overview'}
  <button class="back-to-overview" onclick={backToOverview}>
    <Icon icon={ICONS.back} width="1.25rem" height="1.25rem" />
    Back to Overview
  </button>
{/if}

<style lang="sass">
  .payroll-overview
    display: grid
    gap: 2rem
    
  .overview-header
    @extend %flex-between
    align-items: flex-start
    gap: 2rem
    
    @media (max-width: 768px)
      flex-direction: column
      align-items: stretch
      
  .period-selector
    @extend %flex
    gap: 1rem
    align-items: center
    
    label
      @extend %flex
      gap: 0.5rem
      @extend %font-weight-medium
      color: var(--fg)
      
    select
      min-width: 200px
      
  .action-buttons
    @extend %flex
    gap: 1rem
    
  .payroll-summary
    display: grid
    grid-template-columns: auto 1fr
    gap: 2rem
    align-items: center
    
    @media (max-width: 768px)
      grid-template-columns: 1fr
      
  .summary-card.total-card
    @extend %flex
    gap: 1.5rem
    padding: 2rem
    background: color-mix(in oklab, var(--primary) 10%, transparent)
    border-radius: 1.5rem
    border: 2px solid color-mix(in oklab, var(--primary) 20%, transparent)
    
    svg
      color: var(--primary)
      
    h3
      margin: 0 0 0.5rem 0
      color: var(--primary)
      @extend %font-weight-bold
      
    .total-amount
      font-size: 2rem
      @extend %font-weight-bold
      color: var(--primary)
      font-family: 'JetBrains Mono', monospace
      margin-bottom: 0.25rem
      
    .employee-count
      @extend %text-muted
      
  .summary-stats
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))
    gap: 1rem
    
    .stat-item
      @extend %flex
      gap: 1rem
      padding: 1.5rem
      background: color-mix(in oklab, var(--secondary) 8%, transparent)
      border-radius: 1rem
      
      svg
        color: var(--secondary)
        
      .stat-value
        display: block
        @extend %font-weight-bold
        font-size: 1.25rem
        color: var(--secondary)
        
      .stat-label
        display: block
        font-size: 0.875rem
        @extend %text-muted
        
  .employees-payroll-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr))
    gap: 1.5rem
    
  .employee-payroll-card
    @extend %card
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    &.calculated
      border-color: var(--success)
      background: color-mix(in oklab, var(--success) 4%, transparent)
      
    .employee-header
      @extend %flex-between
      margin-bottom: 1.5rem
      
      .employee-info
        @extend %flex
        gap: 1rem
        min-width: 0
        
        svg
          color: var(--primary)
          flex-shrink: 0
          
        h4
          margin: 0 0 0.5rem 0
          @extend %font-weight-bold
          
        .employee-meta
          @extend %flex
          gap: 0.75rem
          flex-wrap: wrap
          
          .base-salary
            font-size: 0.875rem
            @extend %text-muted
            
          .calculated-badge, .preview-badge
            @extend %flex
            gap: 0.25rem
            padding: 0.25rem 0.5rem
            border-radius: 0.5rem
            font-size: 0.75rem
            @extend %font-weight-medium
            
          .calculated-badge
            background: color-mix(in oklab, var(--success) 15%, transparent)
            color: var(--success)
            
          .preview-badge
            background: color-mix(in oklab, var(--warning) 15%, transparent)
            color: var(--warning)
            
    .salary-breakdown
      .breakdown-row
        @extend %flex-between
        padding: 0.75rem 0
        border-bottom: 1px solid color-mix(in oklab, var(--primary) 10%, transparent)
        
        &:last-child
          border-bottom: none
          
        &.main-row
          padding: 1rem 0
          margin-bottom: 0.5rem
          
          .label
            @extend %font-weight-bold
            font-size: 1.1rem
            
          .value.final
            @extend %font-weight-bold
            font-size: 1.25rem
            color: var(--primary)
            font-family: 'JetBrains Mono', monospace
            
        .label, .sub-label
          @extend %font-weight-medium
          color: var(--fg-muted)
          
        .value, .sub-value
          @extend %font-weight-bold
          color: var(--fg)
          font-family: 'JetBrains Mono', monospace
          
          &.negative
            color: var(--error)
            
      .breakdown-details
        margin: 0.5rem 0
        
        .breakdown-row
          padding: 0.5rem 0
          font-size: 0.875rem
          
      .period-info
        padding-top: 1rem
        margin-top: 1rem
        border-top: 1px solid color-mix(in oklab, var(--primary) 10%, transparent)
        text-align: center
        font-size: 0.875rem
        @extend %text-muted
        
  .select-employee-step
    h3
      @extend %flex
      gap: 0.75rem
      color: var(--primary)
      margin-bottom: 2rem
      
  .employee-selection-grid
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))
    gap: 1rem
    
  .employee-selection-card
    @extend %card
    @extend %flex
    gap: 1rem
    text-align: left
    border: 2px solid color-mix(in oklab, var(--primary) 15%, transparent)
    @extend %transition
    position: relative
    
    &:hover
      @extend %button-hover
      border-color: var(--primary)
      
    &.selected
      border-color: var(--primary)
      background: color-mix(in oklab, var(--primary) 10%, transparent)
      
      > svg:last-child
        position: absolute
        top: 1rem
        right: 1rem
        color: var(--primary)
        
    > svg:first-child
      color: var(--primary)
      flex-shrink: 0
      
    h4
      margin: 0 0 0.5rem 0
      @extend %font-weight-bold
      
    .employee-details
      display: grid
      gap: 0.25rem
      
      .base-salary
        @extend %font-weight-bold
        color: var(--primary)
        
      .employee-attrs
        font-size: 0.875rem
        @extend %text-muted
        
  .calculation-step
    display: grid
    gap: 2rem
    
  .step-header
    text-align: center
    
    .step-badge
      @extend %flex
      gap: 0.5rem
      justify-content: center
      padding: 0.75rem 1.5rem
      background: color-mix(in oklab, var(--primary) 15%, transparent)
      color: var(--primary)
      border-radius: 2rem
      @extend %font-weight-bold
      margin: 0 auto 1rem auto
      display: inline-flex
      
    h3
      margin: 0 0 0.5rem 0
      color: var(--primary)
      @extend %heading-size-medium
      
    p
      @extend %text-muted
      margin: 0
      font-size: 1.1rem
      
  .calculation-explanation
    display: grid
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
    gap: 1.5rem
    
    .formula-card, .calculation-card, .result-card
      padding: 1.5rem
      border-radius: 1rem
      
      h4
        @extend %flex
        gap: 0.5rem
        margin-bottom: 1rem
        @extend %font-weight-bold
        
    .formula-card
      background: color-mix(in oklab, var(--info) 8%, transparent)
      border: 1px solid color-mix(in oklab, var(--info) 15%, transparent)
      
      h4, svg
        color: var(--info)
        
      .formula
        @extend %font-weight-medium
        font-size: 1.1rem
        color: var(--fg)
        
    .calculation-card
      background: color-mix(in oklab, var(--secondary) 8%, transparent)
      border: 1px solid color-mix(in oklab, var(--secondary) 15%, transparent)
      
      h4, svg
        color: var(--secondary)
        
      .calculation
        @extend %font-weight-medium
        font-size: 1.1rem
        color: var(--fg)
        font-family: 'JetBrains Mono', monospace
        
    .result-card
      background: color-mix(in oklab, var(--success) 8%, transparent)
      border: 1px solid color-mix(in oklab, var(--success) 15%, transparent)
      
      h4, svg
        color: var(--success)
        
      .result
        @extend %font-weight-bold
        font-size: 1.5rem
        color: var(--success)
        font-family: 'JetBrains Mono', monospace
        
  .step-details
    @extend %card
    border: 1px solid color-mix(in oklab, var(--primary) 15%, transparent)
    
    h4
      color: var(--primary)
      margin-bottom: 1.5rem
      
    .details-grid
      display: grid
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))
      gap: 1rem
      
      .detail-item
        @extend %flex-between
        padding: 0.75rem
        background: color-mix(in oklab, var(--primary) 6%, transparent)
        border-radius: 0.5rem
        
        .detail-label
          @extend %font-weight-medium
          @extend %text-muted
          
        .detail-value
          @extend %font-weight-bold
          color: var(--fg)
          font-family: 'JetBrains Mono', monospace
          
    .bonus-grid
      display: grid
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))
      gap: 1rem
      
      .bonus-item
        padding: 1rem
        background: color-mix(in oklab, var(--success) 8%, transparent)
        border-radius: 0.75rem
        
        .bonus-header
          @extend %flex
          gap: 0.5rem
          margin-bottom: 0.75rem
          
          svg
            color: var(--success)
            
          .bonus-name
            @extend %font-weight-bold
            color: var(--success)
            
        .bonus-calculation
          @extend %text-muted
          margin-bottom: 0.5rem
          font-family: 'JetBrains Mono', monospace
          
        .bonus-amount
          @extend %font-weight-bold
          color: var(--success)
          font-size: 1.1rem
          font-family: 'JetBrains Mono', monospace
          
    .adjustments-list
      display: grid
      gap: 0.75rem
      
      .adjustment-item
        @extend %flex-between
        padding: 1rem
        background: color-mix(in oklab, var(--secondary) 8%, transparent)
        border-radius: 0.75rem
        
        .adjustment-amount
          @extend %font-weight-bold
          font-size: 1.1rem
          color: var(--secondary)
          font-family: 'JetBrains Mono', monospace
          
          &.negative
            color: var(--error)
            
        .adjustment-comment
          @extend %text-muted
          font-style: italic
          
    .no-adjustments
      @extend %flex
      gap: 1rem
      justify-content: center
      align-items: center
      padding: 2rem
      @extend %text-muted
      
      svg
        opacity: 0.5
        
    .subtotal-breakdown, .deduction-breakdown, .final-summary
      display: grid
      gap: 0.75rem
      
      .subtotal-item, .deduction-item, .summary-row
        @extend %flex-between
        padding: 0.75rem 0
        border-bottom: 1px solid color-mix(in oklab, var(--primary) 10%, transparent)
        
        &.total, &.final-row
          border-top: 2px solid color-mix(in oklab, var(--primary) 20%, transparent)
          border-bottom: none
          padding-top: 1rem
          margin-top: 0.5rem
          
          .component-label, .detail-label, .summary-label
            @extend %font-weight-bold
            font-size: 1.1rem
            
          .component-value, .detail-value, .summary-value
            @extend %font-weight-bold
            font-size: 1.25rem
            
            &.final
              color: var(--primary)
              
        .component-label, .detail-label, .summary-label
          @extend %font-weight-medium
          color: var(--fg-muted)
          
        .component-value, .detail-value, .summary-value
          @extend %font-weight-bold
          color: var(--fg)
          font-family: 'JetBrains Mono', monospace
          
          &.negative
            color: var(--error)
            
    .calculation-complete
      @extend %flex
      gap: 1.5rem
      padding: 1.5rem
      background: color-mix(in oklab, var(--success) 8%, transparent)
      border-radius: 1rem
      margin-top: 2rem
      
      svg
        color: var(--success)
        flex-shrink: 0
        
      h5
        margin: 0 0 0.5rem 0
        color: var(--success)
        @extend %font-weight-bold
        
      p
        margin: 0
        @extend %text-muted
        
  .back-to-overview
    position: fixed
    top: 6rem
    left: 2rem
    @extend %button-secondary
    z-index: 100
    @extend %shadow-lg
    
    @media (max-width: 768px)
      top: 5rem
      left: 1rem
      
  .empty-state
    @extend %grid
    place-items: center
    text-align: center
    gap: 1.5rem
    padding: 4rem 2rem
    
    svg
      @extend %opacity-subtle
      color: var(--fg-muted)
      
    h4
      margin: 0
      color: var(--fg-muted)
      
    p
      @extend %text-muted
      margin: 0
</style>
