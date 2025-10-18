// hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { supabase } from '../components/supabase';

export function useProfile(user) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        // Create a default profile if it doesn't exist
        await createDefaultProfile();
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: user.id, 
            email: user.email,
            name: '',
            phone: ''
          }
        ])
        .select()
        .single();

      if (!error) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return { profile, loading, error, refreshProfile: fetchProfile };
}