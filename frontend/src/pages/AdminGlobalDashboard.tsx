// src/pages/AdminGlobalDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { 
  ChartPieIcon, 
  UsersIcon, 
  DocumentTextIcon,
  ArchiveIcon,
  PlusIcon,
  TrashIcon,
  SpeakerphoneIcon,
  PencilIcon,
  ChevronRightIcon,
  FolderIcon,
  TicketIcon
} from '../components/icons';
import ConfirmModal from '../components/ConfirmModal';

// Types communs
interface Tenant {
  id: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  restaurant_type: string;
  userCount: number;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  tenant_id: number;
  restaurant?: {
    name: string;
  };
  tenant?: {
    id: number;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  parent?: Category;
  children?: Category[];
  created_at: string;
}

interface AdminStats {
  totalTenants: number;
  totalUsers: number;
  totalDocuments: number;
  totalCategories: number;
  totalTickets: number;
  activeUsers: number;
  activityRate: number;
  topTenants?: Array<{
    name: string;
    userCount: number;
    documentCount: number;
  }>;
}

interface CreateTenantData {
  name: string;
  restaurant_type: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
}

interface CreateUserData {
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'viewer';
  tenant_id: number;
}

const AdminGlobalDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'users' | 'categories' | 'tickets'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [selectedTenantForUser, setSelectedTenantForUser] = useState<number | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [showDeleteAllTicketsModal, setShowDeleteAllTicketsModal] = useState(false);
  const [selectedTenantForDeletion, setSelectedTenantForDeletion] = useState<string>('');
  
  // Form states
  const [newTenant, setNewTenant] = useState<CreateTenantData>({
    name: '',
    restaurant_type: 'traditionnel',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937'
  });
  
  const [newUser, setNewUser] = useState<CreateUserData>({
    email: '',
    password: '',
    role: 'viewer',
    tenant_id: 0
  });
  
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    parentId: ''
  });
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Auth check
  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    
    // Load initial data
    Promise.all([
      fetchStats(),
      fetchTenants(),
      fetchUsers(),
      fetchCategories()
    ]);
  }, [user, navigate]);

  // API Functions
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data || data);
      } else {
        // API stats error
        showToast('Erreur lors du chargement des statistiques', 'error');
      }
    } catch (error) {
      // Fetch stats error
      showToast('Erreur lors du chargement des statistiques', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data.data?.data || data.data || []);
      }
    } catch (error) {
      // Fetch tenants error
      showToast('Erreur lors du chargement des tenants', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      // Utiliser la nouvelle route admin globale pour récupérer tous les utilisateurs
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const allUsers = data.data?.data || data.data || [];
        setUsers(allUsers);
      } else {
        // API users error
        showToast('Erreur lors du chargement des utilisateurs', 'error');
      }
    } catch (error) {
      // Fetch users error
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    }
  };

  // Categories API Functions - Approche simple comme demandé par BOSS
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 1. Récupérer les catégories racines (parentId = null)
      const rootResponse = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!rootResponse.ok) {
        throw new Error('Erreur lors du chargement des catégories racines');
      }
      
      const rootData = await rootResponse.json();
      const rootCategories = rootData.data || rootData || [];
      console.log('Catégories racines:', rootCategories);
      
      // 2. Pour chaque catégorie racine, récupérer ses enfants
      const categoriesWithChildren = [];
      for (const rootCat of rootCategories) {
        const childrenResponse = await fetch(`${import.meta.env.VITE_API_URL}/categories?parentId=${rootCat.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (childrenResponse.ok) {
          const childrenData = await childrenResponse.json();
          const children = childrenData.data || childrenData || [];
          console.log(`Enfants de ${rootCat.name}:`, children);
          
          categoriesWithChildren.push({
            ...rootCat,
            children: children
          });
        } else {
          // Si erreur, on garde la catégorie sans enfants
          categoriesWithChildren.push({
            ...rootCat,
            children: []
          });
        }
      }
      
      setCategories(categoriesWithChildren);
      console.log('Toutes les catégories avec enfants:', categoriesWithChildren);
      
    } catch (error) {
      console.error('Erreur fetchCategories:', error);
      showToast('Erreur lors du chargement des catégories', 'error');
    }
  };

  const createCategory = async () => {
    if (!categoryForm.name.trim()) {
      showToast('Le nom de la catégorie est requis', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryForm.name.trim(),
          parentId: categoryForm.parentId || undefined
        }),
      });
      
      if (response.ok) {
        showToast(
          categoryToEdit 
            ? 'Catégorie modifiée avec succès' 
            : 'Catégorie créée avec succès', 
          'success'
        );
        setShowCategoryModal(false);
        setCategoryForm({ name: '', parentId: '' });
        setCategoryToEdit(null);
        fetchCategories();
      } else {
        const error = await response.text();
        showToast(`Erreur: ${error}`, 'error');
      }
    } catch (error) {
      showToast('Erreur lors de la création de la catégorie', 'error');
    }
  };

  const updateCategory = async () => {
    if (!categoryToEdit || !categoryForm.name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/categories/${categoryToEdit.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: categoryForm.name.trim() }),
        }
      );
      
      if (response.ok) {
        showToast('Catégorie modifiée avec succès', 'success');
        setShowCategoryModal(false);
        setCategoryForm({ name: '', parentId: '' });
        setCategoryToEdit(null);
        fetchCategories();
      } else {
        const error = await response.text();
        showToast(`Erreur: ${error}`, 'error');
      }
    } catch (error) {
      showToast('Erreur lors de la modification de la catégorie', 'error');
    }
  };

  const deleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/categories/${categoryToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        showToast('Catégorie supprimée avec succès', 'success');
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
        fetchCategories();
      } else {
        const error = await response.text();
        showToast(`Erreur: ${error}`, 'error');
      }
    } catch (error) {
      showToast('Erreur lors de la suppression de la catégorie', 'error');
    }
  };

  const openEditCategory = (category: Category) => {
    setCategoryToEdit(category);
    setCategoryForm({ 
      name: category.name, 
      parentId: category.parentId || '' 
    });
    setShowCategoryModal(true);
  };

  const openDeleteCategory = (category: Category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // ===== FONCTIONS GESTION UTILISATEURS =====
  const createUser = async () => {
    if (!newUser.email.trim() || !newUser.password.trim() || !newUser.tenant_id) {
      showToast('Tous les champs sont requis', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${newUser.tenant_id}/users/bypass-invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email.trim(),
          password: newUser.password,
          role: newUser.role
        }),
      });

      if (response.ok) {
        showToast('Utilisateur créé avec succès', 'success');
        setShowCreateUserModal(false);
        setNewUser({
          email: '',
          password: '',
          role: 'viewer',
          tenant_id: 0
        });
        await fetchUsers();
        await fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      console.error('Erreur createUser:', error);
      showToast('Erreur lors de la création de l\'utilisateur', 'error');
    }
  };

  const updateUser = async (userId: number, tenantId: number, updateData: { role?: string; is_active?: boolean; email?: string }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${tenantId}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        showToast('Utilisateur modifié avec succès', 'success');
        await fetchUsers();
        await fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Erreur lors de la modification', 'error');
      }
    } catch (error) {
      console.error('Erreur updateUser:', error);
      showToast('Erreur lors de la modification de l\'utilisateur', 'error');
    }
  };

  const deleteUser = async (userId: number, tenantId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast('Utilisateur supprimé avec succès', 'success');
        await fetchUsers();
        await fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.message || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur deleteUser:', error);
      showToast('Erreur lors de la suppression de l\'utilisateur', 'error');
    }
  };

  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setNewUser({
      email: user.email,
      password: '', // On ne prérempli pas le mot de passe
      role: user.role,
      tenant_id: user.tenant_id || 0
    });
    setShowEditUserModal(true);
  };

  const saveUserEdit = async () => {
    if (!userToEdit) return;

    const updateData: { role?: string; email?: string } = {};
    
    if (newUser.role !== userToEdit.role) {
      updateData.role = newUser.role;
    }
    
    if (newUser.email.trim() !== userToEdit.email) {
      updateData.email = newUser.email.trim();
    }

    if (Object.keys(updateData).length === 0) {
      showToast('Aucune modification détectée', 'info');
      return;
    }

    await updateUser(userToEdit.id, userToEdit.tenant_id, updateData);
    setShowEditUserModal(false);
    setUserToEdit(null);
  };

  const createTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTenant),
      });

      if (response.ok) {
        showToast('Tenant créé avec succès', 'success');
        setShowCreateTenantModal(false);
        setNewTenant({
          name: '',
          restaurant_type: 'traditionnel',
          primaryColor: '#4F46E5',
          secondaryColor: '#10B981',
          backgroundColor: '#FFFFFF',
          textColor: '#1F2937'
        });
        await fetchTenants();
        await fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.error?.message || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      // Create tenant error
      showToast('Erreur lors de la création', 'error');
    }
  };

  const deleteTenant = async (tenantId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tenant ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        showToast('Tenant supprimé avec succès', 'success');
        await fetchTenants();
        await fetchStats();
      } else {
        const errorData = await response.json();
        showToast(errorData.error?.message || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      // Delete tenant error
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  // Render functions
  const renderStatCard = (title: string, value: number | string, icon: React.ReactNode, color: string) => (
    <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold opacity-90">{title}</h3>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl opacity-80">
          {icon}
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {renderStatCard('Total Tenants', stats?.totalTenants || 0, '🏢', 'from-blue-500 to-blue-600')}
        {renderStatCard('Total Utilisateurs', stats?.totalUsers || 0, '👥', 'from-green-500 to-green-600')}
        {renderStatCard('Documents', stats?.totalDocuments || 0, '📄', 'from-purple-500 to-purple-600')}
        {renderStatCard('Tickets', stats?.totalTickets || 0, '🎫', 'from-red-500 to-red-600')}
        {renderStatCard('Taux Activité', `${stats?.activityRate || 0}%`, '⚡', 'from-orange-500 to-orange-600')}
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl shadow-sm border p-6">
        <h3 className="text-xl font-bold mb-4 text-muted-foreground">Actions Rapides</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowCreateTenantModal(true)}
            className="flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nouveau Tenant
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className="flex items-center justify-center p-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <ChartPieIcon className="w-5 h-5 mr-2" />
            Gérer Tenants
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className="flex items-center justify-center p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <UsersIcon className="w-5 h-5 mr-2" />
            Gérer Utilisateurs
          </button>
        </div>
      </div>

      {/* Top Tenants */}
      {stats?.topTenants && stats.topTenants.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-bold mb-4 text-muted-foreground">Top Tenants</h3>
          <div className="space-y-3">
            {stats.topTenants.map((tenant, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <span className="font-medium text-muted-foreground">{tenant.name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tenant.userCount} utilisateurs • {tenant.documentCount} documents
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTenants = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-muted-foreground">Gestion des Tenants</h2>
        <button
          onClick={() => setShowCreateTenantModal(true)}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouveau Tenant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="bg-card rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-muted-foreground">{tenant.name}</h3>
                <button
                  onClick={() => deleteTenant(tenant.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium text-muted-foreground">{tenant.restaurant_type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Utilisateurs:</span>
                  <span className="font-medium text-muted-foreground">{tenant.userCount || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Créé le:</span>
                  <span className="font-medium text-muted-foreground">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Color preview */}
              <div className="mt-4 flex space-x-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: tenant.primaryColor }}
                  title="Couleur primaire"
                />
                <div 
                  className="w-6 h-6 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: tenant.secondaryColor }}
                  title="Couleur secondaire"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-muted-foreground">Gestion des Utilisateurs</h2>
        <button
          onClick={() => setShowCreateUserModal(true)}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-gray-200">
              {users.map((user) => {
                // Utiliser directement les informations du tenant depuis la requête
                const tenantName = user.tenant?.name || 'N/A';
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {tenantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => deleteUser(user.id, user.tenant_id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const handleDeleteAllTickets = async () => {
    try {
      // Construire l'URL avec le paramètre tenantId si un tenant est sélectionné
      let url = `${import.meta.env.VITE_API_URL}/tickets/delete-all`;
      if (selectedTenantForDeletion && selectedTenantForDeletion !== '') {
        url += `?tenantId=${selectedTenantForDeletion}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const tenantName = selectedTenantForDeletion 
          ? tenants.find(t => t.id.toString() === selectedTenantForDeletion)?.name || 'tenant sélectionné'
          : 'tous les tenants';
        showToast('success', 'Tickets supprimés', `${result.deleted} tickets ont été supprimés avec succès pour ${tenantName}.`);
        setShowDeleteAllTicketsModal(false);
        setSelectedTenantForDeletion('');
      } else {
        showToast('error', 'Erreur', 'Impossible de supprimer les tickets.');
      }
    } catch (error) {
      showToast('error', 'Erreur', 'Une erreur est survenue lors de la suppression.');
    }
  };

  const renderTickets = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-muted-foreground">Gestion des Tickets</h2>
          <button
            onClick={() => setShowDeleteAllTicketsModal(true)}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Supprimer tous les tickets
          </button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border p-6">
          <div className="text-center py-12">
            <TicketIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Gestion globale des tickets
            </h3>
            <p className="text-muted-foreground mb-4">
              Utilisez le bouton ci-dessus pour supprimer tous les tickets de tous les tenants.
            </p>
            <p className="text-sm text-red-600">
              ⚠️ Attention : Cette action supprimera TOUS les tickets de TOUS les tenants.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCategories = () => {
    const renderCategoryItem = (category: Category, level: number = 0) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);

      return (
        <div key={category.id}>
          <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group">
            <div className="flex items-center space-x-3">
              {/* Bouton expand/collapse pour les catégories avec enfants */}
              {hasChildren ? (
                <button
                  onClick={() => toggleCategoryExpansion(category.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-transform duration-200"
                  title={isExpanded ? "Réduire" : "Développer"}
                >
                  <ChevronRightIcon 
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                      isExpanded ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
              ) : (
                <div className="w-6 h-6" /> // Espace pour l'alignement
              )}
              
              <FolderIcon className="w-5 h-5 text-purple-500" />
              
              <div className="flex flex-col">
                <span className="font-medium text-muted-foreground">
                  {category.name}
                </span>
                {hasChildren && (
                  <span className="text-xs text-gray-500">
                    {category.children.length} sous-catégorie{category.children.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditCategory(category)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="Modifier"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => openDeleteCategory(category)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Supprimer"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Sous-catégories déroulantes */}
          {hasChildren && isExpanded && (
            <div className="ml-6 border-l-2 border-gray-100 pl-4 mt-2 space-y-2">
              {category.children.map(child => (
                <div key={child.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group">
                  <div className="flex items-center space-x-3">
                    <ChevronRightIcon className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700">{child.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditCategory(child)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Modifier"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => openDeleteCategory(child)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                      title="Supprimer"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-muted-foreground">Gestion des Catégories</h2>
            <button
              onClick={() => {
                if (expandedCategories.size === categories.length) {
                  setExpandedCategories(new Set());
                } else {
                  setExpandedCategories(new Set(categories.map(cat => cat.id)));
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              {expandedCategories.size === categories.length ? 'Tout réduire' : 'Tout développer'}
            </button>
          </div>
          <button 
            onClick={() => {
              setCategoryToEdit(null);
              setCategoryForm({ name: '', parentId: '' });
              setShowCategoryModal(true);
            }}
            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvelle Catégorie
          </button>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm border">
          {categories.length === 0 ? (
            <div className="p-16 text-center">
              <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune catégorie trouvée</p>
              <p className="text-sm text-gray-400 mt-2">
                Cliquez sur "Nouvelle Catégorie" pour commencer
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-1">
              {categories.map(category => renderCategoryItem(category))}
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note :</strong> Les catégories sont utilisées pour organiser les documents. 
            La suppression d'une catégorie supprimera également toutes ses sous-catégories.
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-muted-foreground">Chargement du dashboard admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-muted-foreground">Administration Globale</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-gray-800 border border-border rounded-md hover:bg-gray-50"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Vue d\'ensemble', icon: ChartPieIcon },
              { id: 'tenants', label: 'Tenants', icon: SpeakerphoneIcon },
              { id: 'users', label: 'Utilisateurs', icon: UsersIcon },
              { id: 'categories', label: 'Catégories', icon: ArchiveIcon },
              { id: 'tickets', label: 'Tickets', icon: TicketIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-muted-foreground hover:text-gray-700 hover:border-border'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'tenants' && renderTenants()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'categories' && renderCategories()}
        {activeTab === 'tickets' && renderTickets()}
      </div>

      {/* Modal Create Tenant */}
      {showCreateTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Créer un nouveau tenant</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nom du tenant
                  </label>
                  <input
                    type="text"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Restaurant ABC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Type de restaurant
                  </label>
                  <select
                    value={newTenant.restaurant_type}
                    onChange={(e) => setNewTenant({ ...newTenant, restaurant_type: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="traditionnel">Traditionnel</option>
                    <option value="fast_food">Fast Food</option>
                    <option value="gastronomique">Gastronomique</option>
                    <option value="brasserie">Brasserie</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Couleur primaire
                    </label>
                    <input
                      type="color"
                      value={newTenant.primaryColor}
                      onChange={(e) => setNewTenant({ ...newTenant, primaryColor: e.target.value })}
                      className="w-full h-10 rounded-md border border-border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Couleur secondaire
                    </label>
                    <input
                      type="color"
                      value={newTenant.secondaryColor}
                      onChange={(e) => setNewTenant({ ...newTenant, secondaryColor: e.target.value })}
                      className="w-full h-10 rounded-md border border-border"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateTenantModal(false)}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={createTenant}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create User */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Créer un nouvel utilisateur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="utilisateur@exemple.com"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Rôle
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'manager' | 'viewer' })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Tenant
                  </label>
                  <select
                    value={newUser.tenant_id}
                    onChange={(e) => setNewUser({ ...newUser, tenant_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  >
                    <option value={0}>Sélectionner un tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setNewUser({ email: '', password: '', role: 'viewer', tenant_id: 0 });
                  }}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={createUser}
                  disabled={!newUser.email.trim() || !newUser.password.trim() || !newUser.tenant_id}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit User */}
      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Modifier l'utilisateur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="utilisateur@exemple.com"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Rôle
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'manager' | 'viewer' })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">
                    <strong>Tenant:</strong> {userToEdit.tenant?.name || 'Non assigné'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Statut:</strong> {userToEdit.is_active ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditUserModal(false);
                    setUserToEdit(null);
                  }}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={saveUserEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Modifier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create/Edit Category */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">
                {categoryToEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Plats Principaux"
                    autoFocus
                  />
                </div>

                {!categoryToEdit && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Catégorie parente (optionnel)
                    </label>
                    <select
                      value={categoryForm.parentId}
                      onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Aucune (catégorie racine)</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryForm({ name: '', parentId: '' });
                    setCategoryToEdit(null);
                  }}
                  className="px-4 py-2 text-muted-foreground border border-border rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={categoryToEdit ? updateCategory : createCategory}
                  disabled={!categoryForm.name.trim()}
                  className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {categoryToEdit ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Category */}
      <ConfirmModal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={deleteCategory}
        title="Supprimer la catégorie"
      >
        Êtes-vous sûr de vouloir supprimer la catégorie "
        <span className="font-bold">{categoryToDelete?.name}</span>" ?
        <br />
        <br />
        <span className="text-red-600 font-medium">
          ⚠️ Cette action supprimera également toutes les sous-catégories associées.
        </span>
        <br />
        Cette action est irréversible.
      </ConfirmModal>

      {/* Modal Delete All Tickets */}
      <ConfirmModal
        isOpen={showDeleteAllTicketsModal}
        onClose={() => {
          setShowDeleteAllTicketsModal(false);
          setSelectedTenantForDeletion('');
        }}
        onConfirm={handleDeleteAllTickets}
        title="Supprimer tous les tickets"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">
              Sélectionner un tenant (optionnel)
            </label>
            <select
              value={selectedTenantForDeletion}
              onChange={(e) => setSelectedTenantForDeletion(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Tous les tenants</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id.toString()}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
          
          <p>
            {selectedTenantForDeletion ? (
              <>Êtes-vous sûr de vouloir supprimer <span className="font-bold text-red-600">tous les tickets</span> du tenant <span className="font-bold">{tenants.find(t => t.id.toString() === selectedTenantForDeletion)?.name}</span> ?</>
            ) : (
              <>Êtes-vous sûr de vouloir supprimer <span className="font-bold text-red-600">TOUS les tickets</span> de <span className="font-bold text-red-600">TOUS les tenants</span> ?</>
            )}
          </p>
          
          <p className="text-sm text-muted-foreground">
            {selectedTenantForDeletion ? (
              'Cette action supprimera tous les tickets du tenant sélectionné, ainsi que leurs commentaires et pièces jointes.'
            ) : (
              'Cette action supprimera tous les tickets de tous les tenants, ainsi que leurs commentaires et pièces jointes.'
            )}
          </p>
          
          <p className="text-sm font-medium text-red-600">
            ⚠️ Cette action est irréversible !
          </p>
        </div>
      </ConfirmModal>
    </div>
  );
};

export default AdminGlobalDashboard;