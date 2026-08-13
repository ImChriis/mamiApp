import { supabase } from './supabase';

const TABLA = 'mediciones';

export const medicionesService = {
    async obtenerMediciones() {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*');
      // .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  async crearMedicion(registro) {
    const { data, error } = await supabase
      .from(TABLA)
      .insert([registro])
      .select();

    if (error) throw new Error(error.message);
    return data[0];
  },

  async eliminarMedicion(id) {
    const { error } = await supabase
      .from(TABLA)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  },

  async getMetricasRecientes(limite = 10) {
    const { data, error } = await supabase
      .from(TABLA)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw new Error(error.message);
    return data;
  },
}