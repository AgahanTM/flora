"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  AlertTriangle, X, CheckCircle2, 
  MessageSquare, Loader2, AlertCircle,
  Truck, ShieldAlert, PackageX, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { reportApi } from '@/lib/api/reports';
import { IssueType } from '@/lib/types/report';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/utils/toast';

interface IssueReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  productId?: string;
  reviewId?: string;
}

const ISSUE_TYPES: { type: IssueType; label: string; icon: React.ReactNode; color: string }[] = [
  { 
    type: 'defective_product', 
    label: 'Defective Product', 
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'text-rose bg-rose/10'
  },
  { 
    type: 'late_delivery', 
    label: 'Late Delivery', 
    icon: <Truck className="w-5 h-5" />,
    color: 'text-amber-600 bg-amber-50'
  },
  { 
    type: 'wrong_item', 
    label: 'Wrong Item Received', 
    icon: <PackageX className="w-5 h-5" />,
    color: 'text-blue-600 bg-blue-50'
  },
  { 
    type: 'other', 
    label: 'Other Issues', 
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'text-bark/40 bg-mist'
  },
];

export default function IssueReportModal({ isOpen, onClose, orderId, productId, reviewId }: IssueReportModalProps) {
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [description, setDescription] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: any) => reportApi.submitReport(data),
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Issue report submitted successfully');
      setTimeout(() => {
        setIsSuccess(false);
        setIssueType(null);
        setDescription('');
        onClose();
      }, 2000);
    },
    onError: () => {
      toast.error('Failed to submit report. Please try again.');
    }
  });

  const handleSubmit = () => {
    if (!issueType || !description.trim()) return;
    mutation.mutate({
      issue_type: issueType,
      description: description.trim(),
      order_id: orderId,
      product_id: productId,
      review_id: reviewId,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative"
          >
            {/* Success Overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center p-10 text-center space-y-6"
                >
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-display font-bold text-bark italic">Report Logged</h3>
                    <p className="text-sm text-bark/60 leading-relaxed">
                      Our administrative team has been notified. We will investigate and contact you shortly.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-8 md:p-10 space-y-8">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose mb-1 font-black uppercase tracking-widest text-[10px]">
                    <AlertTriangle className="w-4 h-4" />
                    Formal Dispute Resolution
                  </div>
                  <h3 className="text-3xl font-display font-bold text-bark italic">Raise an Issue</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-mist rounded-xl transition-colors">
                  <X className="w-6 h-6 text-bark/20" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-1">Nature of Complaint</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ISSUE_TYPES.map((item) => (
                      <button
                        key={item.type}
                        onClick={() => setIssueType(item.type)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                          issueType === item.type 
                            ? "border-rose bg-rose/5" 
                            : "border-mist hover:border-mist-dark/20 bg-white"
                        )}
                      >
                        <div className={cn("p-2 rounded-xl", item.color)}>
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold text-bark">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-bark/30 ml-1">Evidence & Description</p>
                  <Textarea
                    placeholder="Provide specific details about the issue to expedite investigation..."
                    className="min-h-[120px] rounded-[2rem] border-mist p-5 text-sm focus:ring-rose/20"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  {(orderId || productId) && (
                    <div className="flex items-center gap-2 text-[10px] font-medium text-bark/40 italic px-2">
                      <AlertCircle className="w-3 h-3 text-rose" />
                      Linked to {orderId ? `Order #${orderId.slice(0, 8)}` : `Product Reference`}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!issueType || !description.trim() || mutation.isPending}
                  className="w-full h-14 rounded-2xl bg-rose text-white font-bold gap-3 shadow-xl shadow-rose/20"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" /> Submit Official Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
