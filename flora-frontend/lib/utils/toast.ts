import { toast as hotToast, Toast } from 'react-hot-toast';

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
  };
  message?: string;
}

export const toast = {
  success: (msg: string) => hotToast.success(msg),
  error: (msg: string) => hotToast.error(msg),
  loading: (msg: string) => hotToast.loading(msg),
  dismiss: (id?: string) => hotToast.dismiss(id),
  
  apiError: (error: ApiErrorResponse, defaultMsg: string = "Something went wrong") => {
    const status = error.response?.status;
    const backendError = error.response?.data?.error;
    
    if (status === 401) {
      hotToast.error("Please log in to continue");
      return;
    }
    
    if (status === 403) {
      hotToast.error("You don't have permission to perform this action");
      return;
    }
    
    if (status === 500) {
      hotToast.error("Something went wrong on our end. Please try again.");
      return;
    }
    
    hotToast.error(backendError || error.message || defaultMsg);
  }
};
