import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddMedicine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'supplement',
    type: 'tablet',
    tags: '',
    purpose: '',
    dosage: '',
    duration_days: '',
    start_date: '',
    end_date: '',
    doctor_name: '',
    hospital_location: '',
    prescription_url: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image (JPG, PNG) or PDF file');
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      setUploadingFile(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/upload-prescription`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      handleChange('prescription_url', response.data.shareable_link);
      toast.success('Prescription uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload prescription');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.purpose || !formData.dosage) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Prepare data
      const submitData = {
        ...formData,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '' || submitData[key] === null) {
          delete submitData[key];
        }
      });

      await axios.post(`${API}/medicines`, submitData);
      toast.success('Medicine added successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error adding medicine:', error);
      toast.error('Failed to add medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" data-testid="add-medicine-page">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 hover:bg-white/50"
          data-testid="back-button"
        >
          <ArrowLeft className="mr-2" size={20} />
          Back to Dashboard
        </Button>

        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-3xl font-bold" style={{fontFamily: 'Space Grotesk'}}>Add New Medicine</CardTitle>
            <CardDescription>Fill in the details to add a medicine to your tracker</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">Basic Information</h3>
                
                <div>
                  <Label htmlFor="name">Medicine Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Paracetamol"
                    required
                    data-testid="medicine-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(val) => handleChange('category', val)}>
                      <SelectTrigger id="category" data-testid="category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="supplement">Supplement</SelectItem>
                        <SelectItem value="antibiotic">Antibiotic</SelectItem>
                        <SelectItem value="painkiller">Painkiller</SelectItem>
                        <SelectItem value="vitamin">Vitamin</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
                      <SelectTrigger id="type" data-testid="type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablet">Tablet</SelectItem>
                        <SelectItem value="syrup">Syrup</SelectItem>
                        <SelectItem value="cream">Cream</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => handleChange('tags', e.target.value)}
                    placeholder="e.g., beauty, cosmetic, health (comma-separated)"
                    data-testid="tags-input"
                  />
                </div>
              </div>

              {/* Usage Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">Usage Information</h3>
                
                <div>
                  <Label htmlFor="purpose">Purpose/Use Case *</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    placeholder="Why are you taking this medicine?"
                    rows={3}
                    required
                    data-testid="purpose-input"
                  />
                </div>

                <div>
                  <Label htmlFor="dosage">Dosage *</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => handleChange('dosage', e.target.value)}
                    placeholder="e.g., 1 tablet daily after lunch"
                    required
                    data-testid="dosage-input"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration_days">Duration (days)</Label>
                    <Input
                      id="duration_days"
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => handleChange('duration_days', e.target.value)}
                      placeholder="30"
                      data-testid="duration-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => handleChange('start_date', e.target.value)}
                      data-testid="start-date-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => handleChange('end_date', e.target.value)}
                      data-testid="end-date-input"
                    />
                  </div>
                </div>
              </div>

              {/* Doctor Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">Doctor Information</h3>
                
                <div>
                  <Label htmlFor="doctor_name">Doctor Name</Label>
                  <Input
                    id="doctor_name"
                    value={formData.doctor_name}
                    onChange={(e) => handleChange('doctor_name', e.target.value)}
                    placeholder="Dr. John Doe"
                    data-testid="doctor-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="hospital_location">Hospital/Clinic Location</Label>
                  <Input
                    id="hospital_location"
                    value={formData.hospital_location}
                    onChange={(e) => handleChange('hospital_location', e.target.value)}
                    placeholder="Apollo Hospital, New York"
                    data-testid="hospital-input"
                  />
                </div>
              </div>

              {/* Prescription Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">Prescription</h3>
                
                <div>
                  <Label htmlFor="prescription">Upload Prescription (Image or PDF)</Label>
                  <div className="mt-2">
                    <label htmlFor="prescription" className="cursor-pointer">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-indigo-500 transition-colors text-center">
                        {uploadingFile ? (
                          <Loader2 className="mx-auto mb-2 animate-spin text-indigo-600" size={32} />
                        ) : (
                          <Upload className="mx-auto mb-2 text-slate-400" size={32} />
                        )}
                        <p className="text-sm text-slate-600">
                          {uploadingFile ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG or PDF (max 50MB)</p>
                      </div>
                      <input
                        id="prescription"
                        type="file"
                        onChange={handleFileUpload}
                        accept="image/jpeg,image/jpg,image/png,application/pdf"
                        className="hidden"
                        disabled={uploadingFile}
                        data-testid="prescription-upload-input"
                      />
                    </label>
                  </div>
                  {formData.prescription_url && (
                    <p className="text-sm text-green-600 mt-2">✓ Prescription uploaded successfully</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading || uploadingFile}
                  data-testid="submit-button"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={20} />
                      Adding...
                    </>
                  ) : (
                    'Add Medicine'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMedicine;