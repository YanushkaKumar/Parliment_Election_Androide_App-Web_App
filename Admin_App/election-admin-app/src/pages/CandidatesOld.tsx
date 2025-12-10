import { useState, useEffect, useRef, useMemo } from 'react';
import { addDoc, collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
// @ts-ignore: no declaration file for '../firebase' (create a firebase.d.ts with proper types to remove this)
import { db } from '../firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Trash2, Edit, X, Activity, ImageIcon, Search, Filter, Download, Award, MapPin } from 'lucide-react';

interface CandidateData {
  candidateId: string;
  candidateName: string;
  candidateParty: string;
  district: string;
  constituency: string;
  electionName: string;
  votes: number;
  candidatePhotoBase64: string;
  partySymbolBase64: string;
}

interface Election {
  id: string;
  name: string;
}

interface StoredCandidate extends CandidateData {
  id: string;
}

export default function CandidatesOld() {
  const [candidateData, setCandidateData] = useState<CandidateData>({
    candidateId: '',
    candidateName: '',
    candidateParty: '',
    district: '',
    constituency: '',
    electionName: '',
    votes: 0,
    candidatePhotoBase64: '',
    partySymbolBase64: '',
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [symbolPreview, setSymbolPreview] = useState<string | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [candidates, setCandidates] = useState<StoredCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterParty, setFilterParty] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const symbolInputRef = useRef<HTMLInputElement>(null);

  const districts = ['Colombo', 'Gampaha', 'Kandy', 'Galle', 'Jaffna', 'Matale'];

  // Get unique parties from candidates
  const uniqueParties = useMemo(() => {
    const parties = new Set(candidates.map(c => c.candidateParty).filter(Boolean));
    return Array.from(parties).sort();
  }, [candidates]);

  // Filter candidates based on search and filters
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const matchesSearch = searchTerm === '' || 
        candidate.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.candidateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.candidateParty.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDistrict = filterDistrict === '' || candidate.district === filterDistrict;
      const matchesParty = filterParty === '' || candidate.candidateParty === filterParty;
      
      return matchesSearch && matchesDistrict && matchesParty;
    });
  }, [candidates, searchTerm, filterDistrict, filterParty]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Candidate ID', 'Name', 'Party', 'District', 'Constituency', 'Election', 'Votes'];
    const csvData = filteredCandidates.map(c => [
      c.candidateId,
      c.candidateName,
      c.candidateParty,
      c.district,
      c.constituency,
      c.electionName,
      c.votes.toString()
    ]);
    
    const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchElections();
    fetchCandidates();
  }, []);

  const fetchElections = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'elections'));
      const electionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Election[];
      setElections(electionsList);
    } catch (error) {
      console.error('Error fetching elections: ', error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'candidates'));
      const candidatesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StoredCandidate[];
      setCandidates(candidatesList);
    } catch (error) {
      console.error('Error fetching candidates: ', error);
    }
  };

  const compressImage = (
    file: File,
    maxWidth = 500,
    maxHeight = 500,
    quality = 0.7
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
      };
    });
  };

  const handleCandidatePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file);
        setCandidateData({ ...candidateData, candidatePhotoBase64: compressedBase64 });
        setPhotoPreview(compressedBase64);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again with a smaller image.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePartySymbolChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const compressedBase64 = await compressImage(file, 300, 300, 0.6);
        setCandidateData({ ...candidateData, partySymbolBase64: compressedBase64 });
        setSymbolPreview(compressedBase64);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again with a smaller image.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (candidateData.candidatePhotoBase64 && candidateData.partySymbolBase64) {
        const totalSize =
          (candidateData.candidatePhotoBase64.length +
            candidateData.partySymbolBase64.length) /
          1024 /
          1024;
        if (totalSize > 0.8) {
          const proceed = window.confirm(
            `The images are quite large (${totalSize.toFixed(2)}MB). This may affect your Firestore document size limits. Do you want to proceed?`
          );
          if (!proceed) {
            setLoading(false);
            return;
          }
        }
      }

      if (isEditing && editId) {
        const candidateRef = doc(db, 'candidates', editId);
        await updateDoc(candidateRef, candidateData as any);
        alert('Candidate updated successfully!');
      } else {
        await addDoc(collection(db, 'candidates'), candidateData);
        alert('Candidate added successfully!');
      }

      resetForm();
      fetchCandidates();
    } catch (error: any) {
      console.error('Error handling candidate: ', error);
      alert(`Failed to ${isEditing ? 'update' : 'add'} candidate: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCandidateData({
      candidateId: '',
      candidateName: '',
      candidateParty: '',
      district: '',
      constituency: '',
      electionName: '',
      votes: 0,
      candidatePhotoBase64: '',
      partySymbolBase64: '',
    });
    setPhotoPreview(null);
    setSymbolPreview(null);
    setIsEditing(false);
    setEditId(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (symbolInputRef.current) symbolInputRef.current.value = '';
  };

  const handleEditCandidate = (candidate: StoredCandidate) => {
    setIsEditing(true);
    setEditId(candidate.id);
    setCandidateData({
      candidateId: candidate.candidateId || '',
      candidateName: candidate.candidateName || '',
      candidateParty: candidate.candidateParty || '',
      district: candidate.district || '',
      constituency: candidate.constituency || '',
      electionName: candidate.electionName || '',
      votes: candidate.votes || 0,
      candidatePhotoBase64: candidate.candidatePhotoBase64 || '',
      partySymbolBase64: candidate.partySymbolBase64 || '',
    });
    setPhotoPreview(candidate.candidatePhotoBase64 || null);
    setSymbolPreview(candidate.partySymbolBase64 || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this candidate? This action cannot be undone.'
    );

    if (confirmDelete) {
      setLoading(true);
      try {
        const candidateRef = doc(db, 'candidates', candidateId);
        await deleteDoc(candidateRef);
        setCandidates(candidates.filter((candidate) => candidate.id !== candidateId));
        if (editId === candidateId) {
          resetForm();
        }
        alert('Candidate deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting candidate: ', error);
        alert(`Failed to delete candidate: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Update Candidate' : 'Candidate Registration'}
          </h1>
          <p className="text-gray-600 mt-1">Manage candidate information and upload photos</p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{candidates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Parties</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueParties.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MapPin className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Districts Covered</p>
                <p className="text-2xl font-bold text-gray-900">{new Set(candidates.map(c => c.district).filter(Boolean)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Filter className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCandidates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or party..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              title="Filter by district"
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white min-w-[160px]"
            >
              <option value="">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              title="Filter by party"
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white min-w-[160px]"
            >
              <option value="">All Parties</option>
              {uniqueParties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-t-4 border-t-blue-600">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {isEditing ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
            </div>
            <span>{isEditing ? 'Update Candidate Information' : 'Add New Candidate'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCandidateSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Candidate ID</label>
                
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Candidate Name</label>
                
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Party</label>
               
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">District</label>
               
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Constituency</label>

              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Election</label>
               
              </div>

              <div className="space-y-2">
                <label htmlFor="candidatePhoto" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isEditing ? 'Update Photo (optional)' : 'Candidate Photo'}
                </label>
                <input
                  id="candidatePhoto"
                  ref={photoInputRef}
                  type="file"
                  title={isEditing ? 'Update candidate photo' : 'Upload candidate photo'}
                  aria-label={isEditing ? 'Update candidate photo' : 'Upload candidate photo'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  accept="image/*"
                  onChange={handleCandidatePhotoChange}
                  required={!isEditing && !photoPreview}
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Candidate preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-indigo-200"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="partySymbol" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  {isEditing ? 'Update Symbol (optional)' : 'Party Symbol'}
                </label>
                <input
                  id="partySymbol"
                  ref={symbolInputRef}
                  type="file"
                  title={isEditing ? 'Update party symbol' : 'Upload party symbol'}
                  aria-label={isEditing ? 'Update party symbol' : 'Upload party symbol'}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                  accept="image/*"
                  onChange={handlePartySymbolChange}
                  required={!isEditing && !symbolPreview}
                />
                {symbolPreview && (
                  <img
                    src={symbolPreview}
                    alt="Party symbol preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-indigo-200"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? (
                  <Activity className="w-5 h-5 animate-spin" />
                ) : isEditing ? (
                  'Update Candidate'
                ) : (
                  'Add Candidate'
                )}
              </Button>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <X className="w-5 h-5 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          All Candidates 
          {filteredCandidates.length !== candidates.length && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (showing {filteredCandidates.length} of {candidates.length})
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCandidates.length === 0 ? (
            <div className="col-span-full text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">
                {candidates.length === 0 ? 'No candidates registered' : 'No candidates found'}
              </p>
              <p className="text-sm mt-1 text-gray-500">
                {candidates.length === 0 ? 'Add your first candidate to get started' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            filteredCandidates.map((candidate, index) => {
              const headerColors = [
                'bg-blue-600',
                'bg-green-600', 
                'bg-orange-600',
                'bg-teal-600',
                'bg-indigo-600',
                'bg-rose-600'
              ];
              const headerColor = headerColors[index % headerColors.length];
              
              return (
                <Card key={candidate.id} className="group hover:shadow-xl transition-all duration-200 overflow-hidden">
                  <div className={`${headerColor} px-6 py-4`}>
                    <h3 className="text-white text-lg font-semibold truncate">
                      {candidate.candidateName}
                    </h3>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-center">
                      {candidate.candidatePhotoBase64 ? (
                        <img
                          src={candidate.candidatePhotoBase64}
                          alt={candidate.candidateName}
                          className="w-28 h-28 object-cover rounded-full border-4 border-gray-100 shadow-md"
                        />
                      ) : (
                        <div className="w-28 h-28 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="w-14 h-14 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium min-w-[90px]">ID:</span>
                        <span className="text-gray-900 font-semibold">{candidate.candidateId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium min-w-[90px]">Party:</span>
                        <span className="text-gray-900">{candidate.candidateParty}</span>
                      </div>
                      {candidate.partySymbolBase64 && (
                        <div className="flex justify-center py-2">
                          <img
                            src={candidate.partySymbolBase64}
                            alt="Party symbol"
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium min-w-[90px]">District:</span>
                        <span className="text-gray-900">{candidate.district}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-medium min-w-[90px]">Constituency:</span>
                        <span className="text-gray-900">{candidate.constituency}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditCandidate(candidate)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeleteCandidate(candidate.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
