/**
 * Simple notification system using browser alerts
 */

export const notify = {
  success(message, options = {}) {
    console.log('✅ Success:', message);
    if (options.showAlert !== false) {
      alert(`✅ ${message}`);
    }
  },
  
  error(message, options = {}) {
    console.error('❌ Error:', message);
    if (options.showAlert !== false) {
      alert(`❌ ${message}`);
    }
  },
  
  warning(message, options = {}) {
    console.warn('⚠️ Warning:', message);
    if (options.showAlert !== false) {
      alert(`⚠️ ${message}`);
    }
  },
  
  info(message, options = {}) {
    console.info('ℹ️ Info:', message);
    if (options.showAlert !== false) {
      alert(`ℹ️ ${message}`);
    }
  }
}; 