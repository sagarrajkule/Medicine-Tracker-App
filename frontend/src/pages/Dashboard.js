import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pill, Plus, Edit, Trash2, Filter, Search, Calendar, User, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Helper function to create full prescription URLs
  const getFullPrescriptionUrl = (relativeUrl) => {
    if (!relativeUrl) return null;
    // If the URL is already absolute (starts with http/https), return as-is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
      return relativeUrl;
    }
    // Otherwise, prepend the backend URL
    return `${BACKEND_URL}${relativeUrl}`;
  };

  useEffect(() => {
    fetchMedicines();
    fetchStats();
  }, []);

  useEffect(() => {
    filterMedicines();
  }, [medicines, searchQuery, categoryFilter, typeFilter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/medicines`);
      setMedicines(response.data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filterMedicines = () => {
    let filtered = [...medicines];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(med =>
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.purpose.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(med => med.category === categoryFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(med => med.type === typeFilter);
    }

    setFilteredMedicines(filtered);
  };

  const handleDelete = async (id, name) => {
    try {
      await axios.delete(`${API}/medicines/${id}`);
      toast.success(`${name} deleted successfully`);
      fetchMedicines();
      fetchStats();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast.error('Failed to delete medicine');
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'supplement': 'bg-emerald-100 text-emerald-700',
      'antibiotic': 'bg-rose-100 text-rose-700',
      'painkiller': 'bg-amber-100 text-amber-700',
      'vitamin': 'bg-cyan-100 text-cyan-700',
      'other': 'bg-slate-100 text-slate-700'
    };
    return colors[category?.toLowerCase()] || colors.other;
  };

  const getTypeColor = (type) => {
    const colors = {
      'tablet': 'bg-blue-100 text-blue-700',
      'syrup': 'bg-purple-100 text-purple-700',
      'cream': 'bg-pink-100 text-pink-700',
      'injection': 'bg-red-100 text-red-700',
      'other': 'bg-gray-100 text-gray-700'
    };
    return colors[type?.toLowerCase()] || colors.other;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold mb-2" style={{fontFamily: 'Space Grotesk'}} data-testid="dashboard-title">
                <Pill className="inline-block mr-3 text-indigo-600" size={40} />
                Medicine Tracker
              </h1>
              <p className="text-slate-600 text-lg">Manage your medicines and prescriptions</p>
            </div>
            <Button
              onClick={() => navigate('/add')}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl"
              data-testid="add-medicine-button"
            >
              <Plus className="mr-2" size={20} />
              Add Medicine
            </Button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="glass-card border-0">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">Total Medicines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-indigo-600">{stats.total_medicines}</div>
                </CardContent>
              </Card>
              {Object.entries(stats.by_category).slice(0, 3).map(([category, count]) => (
                <Card key={category} className="glass-card border-0">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600 capitalize">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-700">{count}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Filters */}
          <Card className="glass-card border-0">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                    <Input
                      placeholder="Search medicines..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-slate-200"
                      data-testid="search-input"
                    />
                  </div>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="category-filter">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="supplement">Supplement</SelectItem>
                    <SelectItem value="antibiotic">Antibiotic</SelectItem>
                    <SelectItem value="painkiller">Painkiller</SelectItem>
                    <SelectItem value="vitamin">Vitamin</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tablet">Tablet</SelectItem>
                    <SelectItem value="syrup">Syrup</SelectItem>
                    <SelectItem value="cream">Cream</SelectItem>
                    <SelectItem value="injection">Injection</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medicines Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <Card className="glass-card border-0">
            <CardContent className="py-16 text-center">
              <Pill className="mx-auto mb-4 text-slate-400" size={64} />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">No medicines found</h3>
              <p className="text-slate-500 mb-6">Start by adding your first medicine</p>
              <Button onClick={() => navigate('/add')} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2" size={20} />
                Add Medicine
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="medicines-grid">
            {filteredMedicines.map((medicine) => (
              <Card key={medicine.id} className="glass-card border-0 hover:shadow-2xl transition-all duration-300 animate-fade-in" data-testid={`medicine-card-${medicine.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-xl font-bold text-slate-800">{medicine.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/edit/${medicine.id}`)}
                        className="hover:bg-blue-100 hover:text-blue-700"
                        data-testid={`edit-button-${medicine.id}`}
                      >
                        <Edit size={18} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-100 hover:text-red-700"
                            data-testid={`delete-button-${medicine.id}`}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {medicine.name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(medicine.id, medicine.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getCategoryColor(medicine.category)}>
                      {medicine.category}
                    </Badge>
                    <Badge className={getTypeColor(medicine.type)}>
                      {medicine.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Purpose:</p>
                      <p className="text-slate-600">{medicine.purpose}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Dosage:</p>
                      <p className="text-slate-600">{medicine.dosage}</p>
                    </div>
                    {medicine.tags && (
                      <div>
                        <p className="font-semibold text-slate-700 mb-1">Tags:</p>
                        <div className="flex flex-wrap gap-1">
                          {medicine.tags.split(',').map((tag, idx) => (
                            <span key={idx} className="medicine-tag">{tag.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {medicine.start_date && (
                      <div className="flex items-center text-slate-600">
                        <Calendar size={16} className="mr-2" />
                        <span>{new Date(medicine.start_date).toLocaleDateString()}</span>
                        {medicine.end_date && (
                          <span> - {new Date(medicine.end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    {medicine.doctor_name && (
                      <div className="flex items-center text-slate-600">
                        <User size={16} className="mr-2" />
                        <span>Dr. {medicine.doctor_name}</span>
                      </div>
                    )}
                    {medicine.hospital_location && (
                      <div className="flex items-center text-slate-600">
                        <MapPin size={16} className="mr-2" />
                        <span>{medicine.hospital_location}</span>
                      </div>
                    )}
                    {medicine.prescription_url && (
                      <div>
                        <a
                          href={getFullPrescriptionUrl(medicine.prescription_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <FileText size={16} className="mr-2" />
                          View Prescription
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
