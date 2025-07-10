#!/usr/bin/env node

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Generate a detailed coverage report with metrics and recommendations
 */
async function generateCoverageReport() {
  try {
    const coverageDir = path.join(process.cwd(), 'coverage');
    const coverageJsonPath = path.join(coverageDir, 'coverage-summary.json');
    
    // Check if coverage data exists
    try {
      await fs.access(coverageJsonPath);
    } catch (error) {
      console.error('Coverage data not found. Run: npm run test:coverage');
      process.exit(1);
    }

    // Read coverage data
    const coverageData = JSON.parse(await fs.readFile(coverageJsonPath, 'utf-8'));
    
    // Generate report
    const report = generateReport(coverageData);
    
    // Write report to file
    const reportPath = path.join(coverageDir, 'detailed-report.md');
    await fs.writeFile(reportPath, report);
    
    console.log('📊 Coverage report generated:', reportPath);
    
    // Print summary to console
    printSummary(coverageData);
    
  } catch (error) {
    console.error('Failed to generate coverage report:', error);
    process.exit(1);
  }
}

function generateReport(coverageData) {
  const timestamp = new Date().toISOString();
  
  let report = `# Code Coverage Report

*Generated on: ${timestamp}*

## Overall Coverage Summary

`;

  const total = coverageData.total;
  
  report += `| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|---------|
| Lines | ${total.lines.pct}% | 80% | ${getStatus(total.lines.pct, 80)} |
| Functions | ${total.functions.pct}% | 80% | ${getStatus(total.functions.pct, 80)} |
| Branches | ${total.branches.pct}% | 80% | ${getStatus(total.branches.pct, 80)} |
| Statements | ${total.statements.pct}% | 80% | ${getStatus(total.statements.pct, 80)} |

`;

  // File-by-file breakdown
  report += `## File Coverage Details

`;

  const files = Object.entries(coverageData)
    .filter(([key]) => key !== 'total')
    .sort(([, a], [, b]) => b.lines.pct - a.lines.pct);

  files.forEach(([filePath, coverage]) => {
    const fileName = path.basename(filePath);
    const relativeFile = path.relative(process.cwd(), filePath);
    
    report += `### ${fileName}
- **Path**: \`${relativeFile}\`
- **Lines**: ${coverage.lines.pct}% (${coverage.lines.covered}/${coverage.lines.total})
- **Functions**: ${coverage.functions.pct}% (${coverage.functions.covered}/${coverage.functions.total})
- **Branches**: ${coverage.branches.pct}% (${coverage.branches.covered}/${coverage.branches.total})
- **Statements**: ${coverage.statements.pct}% (${coverage.statements.covered}/${coverage.statements.total})

`;
  });

  // Recommendations
  report += generateRecommendations(coverageData);

  return report;
}

function generateRecommendations(coverageData) {
  let recommendations = `## Recommendations

`;

  const total = coverageData.total;
  const lowCoverageFiles = Object.entries(coverageData)
    .filter(([key, coverage]) => key !== 'total' && coverage.lines.pct < 80)
    .sort(([, a], [, b]) => a.lines.pct - b.lines.pct);

  if (lowCoverageFiles.length > 0) {
    recommendations += `### Files Needing Attention

The following files have coverage below the 80% threshold:

`;

    lowCoverageFiles.forEach(([filePath, coverage]) => {
      const fileName = path.basename(filePath);
      recommendations += `- **${fileName}**: ${coverage.lines.pct}% line coverage
  - Add tests for uncovered lines
  - Consider refactoring complex functions
  - Focus on edge cases and error handling

`;
    });
  }

  if (total.branches.pct < 80) {
    recommendations += `### Branch Coverage Improvement

Current branch coverage: ${total.branches.pct}%

- Add tests for conditional statements (if/else, switch)
- Test both success and failure paths
- Cover all logical operators (&&, ||)
- Test exception handling paths

`;
  }

  if (total.functions.pct < 80) {
    recommendations += `### Function Coverage Improvement

Current function coverage: ${total.functions.pct}%

- Identify untested functions
- Add unit tests for each public method
- Test private functions through public interfaces
- Consider removing unused code

`;
  }

  // General recommendations
  recommendations += `### General Recommendations

1. **Maintain Coverage**: Keep coverage above 80% for all metrics
2. **Quality over Quantity**: Focus on meaningful tests rather than just coverage numbers
3. **Integration Tests**: Add end-to-end tests for complex workflows
4. **Edge Cases**: Test boundary conditions and error scenarios
5. **Regression Tests**: Add tests for any bugs found in production

### Next Steps

- [ ] Review files with low coverage
- [ ] Add missing tests for critical paths
- [ ] Update CI/CD pipeline to enforce coverage thresholds
- [ ] Regular coverage review in code reviews

`;

  return recommendations;
}

function getStatus(actual, threshold) {
  if (actual >= threshold) {
    return '✅ Pass';
  } else if (actual >= threshold - 5) {
    return '⚠️ Warning';
  } else {
    return '❌ Fail';
  }
}

function printSummary(coverageData) {
  const total = coverageData.total;
  
  console.log('\n📈 Coverage Summary:');
  console.log(`Lines:      ${total.lines.pct}%`);
  console.log(`Functions:  ${total.functions.pct}%`);
  console.log(`Branches:   ${total.branches.pct}%`);
  console.log(`Statements: ${total.statements.pct}%`);
  
  const overallScore = (
    total.lines.pct + 
    total.functions.pct + 
    total.branches.pct + 
    total.statements.pct
  ) / 4;
  
  console.log(`\n🎯 Overall Score: ${overallScore.toFixed(1)}%`);
  
  if (overallScore >= 80) {
    console.log('✅ Coverage targets met!');
  } else {
    console.log('⚠️ Coverage below target (80%)');
  }
}

// Run the script
generateCoverageReport().catch(console.error);