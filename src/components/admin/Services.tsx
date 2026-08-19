'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Service {
  id: string;
  package_name: string;
  description: string;
  key_features: { feature: string }[];
  target_audience: { audience: string }[];
  suggested_pricing: string;
  display_order: number;
  created_at: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'created_at'>>({
    package_name: '',
    description: '',
    key_features: [],
    target_audience: [],
    suggested_pricing: '',
    display_order: 0,
  });
  const [newFeature, setNewFeature] = useState('');
  const [newAudience, setNewAudience] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(formData)
          .eq('id', editingService.id);
        
        if (error) throw error;
      } else {
        // Create new service
        const { error } = await supabase
          .from('services')
          .insert([formData]);
        
        if (error) throw error;
      }
      
      // Reset form
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      package_name: '',
      description: '',
      key_features: [],
      target_audience: [],
      suggested_pricing: '',
      display_order: 0,
    });
    setNewFeature('');
    setNewAudience('');
    setEditingService(null);
    setShowForm(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      package_name: service.package_name,
      description: service.description,
      key_features: [...service.key_features],
      target_audience: [...service.target_audience],
      suggested_pricing: service.suggested_pricing,
      display_order: service.display_order,
    });
    setShowForm(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        key_features: [...formData.key_features, { feature: newFeature.trim() }],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...formData.key_features];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, key_features: newFeatures });
  };

  const addAudience = () => {
    if (newAudience.trim()) {
      setFormData({
        ...formData,
        target_audience: [...formData.target_audience, { audience: newAudience.trim() }],
      });
      setNewAudience('');
    }
  };

  const removeAudience = (index: number) => {
    const newAudienceList = [...formData.target_audience];
    newAudienceList.splice(index, 1);
    setFormData({ ...formData, target_audience: newAudienceList });
  };

  return (
    <div>
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-admin text-2xl sm:text-3xl text-ink-deep">Services</h1>
              <p className="text-muted mt-2">Manage service packages and offerings</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center justify-center px-4 py-2 w-full sm:w-auto bg-ink text-paper rounded-lg hover:bg-ink-deep transition-colors focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <Plus size={20} className="mr-2" />
              Add Service
            </button>
          </div>
        </div>

        {showForm && (
          <div className="mb-8 bg-surface border border-rule p-4 sm:p-6">
            <h2 className="text-xl font-bold text-ink-deep mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Package Name *
                  </label>
                  <input
                    type="text"
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors"
                    placeholder="Enter package name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Suggested Pricing *
                  </label>
                  <input
                    type="text"
                    value={formData.suggested_pricing}
                    onChange={(e) => setFormData({ ...formData, suggested_pricing: e.target.value })}
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors"
                    placeholder="e.g., $99/month"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors"
                    placeholder="0"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors resize-vertical"
                    placeholder="Describe the service package"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">
                    Key Features
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature"
                      className="flex-1 px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors focus:outline-none focus:ring-1 focus:ring-ink flex-shrink-0 whitespace-nowrap"
                      disabled={!newFeature.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {formData.key_features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.key_features.map((featureObj, index) => (
                        <div key={index} className="flex items-center bg-ink/5 text-ink rounded-full px-3 py-1">
                          <span className="text-sm">{featureObj.feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="ml-2 text-ink/70 hover:text-ink transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1">
                    Target Audience
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 mb-2">
                    <input
                      type="text"
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value)}
                      placeholder="Add target audience"
                      className="flex-1 px-3 py-2 border border-rule bg-surface focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink transition-colors"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAudience())}
                    />
                    <button
                      type="button"
                      onClick={addAudience}
                      className="px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors focus:outline-none focus:ring-1 focus:ring-ink flex-shrink-0 whitespace-nowrap"
                      disabled={!newAudience.trim()}
                    >
                      Add
                    </button>
                  </div>
                  {formData.target_audience.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.target_audience.map((audienceObj, index) => (
                        <div key={index} className="flex items-center bg-ink/5 text-ink rounded-full px-3 py-1">
                          <span className="text-sm">{audienceObj.audience}</span>
                          <button
                            type="button"
                            onClick={() => removeAudience(index)}
                            className="ml-2 text-ink/70 hover:text-ink transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-end sm:space-x-3 sm:space-y-0 space-y-2 pt-4 border-t border-rule">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-rule text-ink rounded-md hover:bg-paper transition-colors focus:outline-none focus:ring-1 focus:ring-ink w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink text-paper rounded-md hover:bg-ink-deep transition-colors focus:outline-none focus:ring-1 focus:ring-ink w-full sm:w-auto"
                >
                  {editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface p-6 border border-rule">
                <div className="animate-pulse">
                  <div className="h-4 bg-paper-2 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-paper-2 rounded w-1/2 mb-2"></div>
                  <div className="h-20 bg-paper-2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div key={service.id} className="bg-surface border border-rule p-4 sm:p-6 hover:border-ink transition-colors">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-ink-deep mb-1">{service.package_name}</h3>
                    <p className="text-sm text-muted line-clamp-2">{service.description}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:ml-4">
                    <span className="px-3 py-1 bg-ink/10 text-ink rounded-full text-sm font-medium whitespace-nowrap">
                      {service.suggested_pricing}
                    </span>
                    <span className="px-2 py-1 bg-paper text-ink rounded text-xs whitespace-nowrap">
                      Order: {service.display_order}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-xs text-muted font-medium">Features:</span>
                  {service.key_features.slice(0, 3).map((featureObj, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-ink/10 text-ink">
                      {featureObj.feature}
                    </span>
                  ))}
                  {service.key_features.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-paper text-ink">
                      +{service.key_features.length - 3}
                    </span>
                  )}
                </div>
                
                <div className="flex justify-end space-x-2 pt-2 border-t border-rule">
                  <button
                    onClick={() => handleEdit(service)}
                    className="text-ink hover:text-ink-deep p-1 rounded focus:outline-none focus:ring-1 focus:ring-ink transition-colors"
                    aria-label="Edit service"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-600 hover:text-red-900 p-1 rounded focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-colors"
                    aria-label="Delete service"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {services.length === 0 && !loading && (
              <div className="text-center py-12 bg-surface border border-rule">
                <div className="text-muted mb-4">
                  <Plus className="mx-auto h-12 w-12" />
                </div>
                <p className="text-muted text-lg">No services found</p>
                <p className="text-muted mt-1">Get started by adding your first service package.</p>
              </div>
            )}
          </div>
        )}
    </div>
  );
}