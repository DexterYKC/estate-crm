'use client';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, Star, Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage, base64SizeBytes } from '@/lib/image-client';

const MAX_TOTAL_BYTES = 4 * 1024 * 1024; // marge sous la limite de payload des Netlify Functions (6 Mo)

export default function PropertyImagesField({ images = [], onChange }) {
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const dragIndexRef = useRef(null);
  const fileInputRef = useRef(null);

  const list = images.filter(Boolean);

  function setList(next) {
    onChange(next.length ? next : []);
  }

  function checkTotalSize(next) {
    const total = next.reduce((sum, img) => sum + (img.startsWith('data:') ? base64SizeBytes(img) : 0), 0);
    if (total > MAX_TOTAL_BYTES) {
      toast.warning('Le poids total des photos est élevé — pense à en retirer pour rester léger sur Netlify.');
    }
  }

  async function addFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    try {
      const compressed = await Promise.all(imageFiles.map(f => compressImage(f)));
      const next = [...list, ...compressed];
      setList(next);
      checkTotalSize(next);
    } catch (err) {
      toast.error("Erreur lors du traitement d'une image : " + err.message);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function removeAt(i) {
    setList(list.filter((_, k) => k !== i));
  }

  function setAsMain(i) {
    if (i === 0) return;
    const next = [...list];
    const [img] = next.splice(i, 1);
    next.unshift(img);
    setList(next);
  }

  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  }

  function onThumbDragStart(i) {
    dragIndexRef.current = i;
  }

  function onThumbDrop(i) {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === i) return;
    const next = [...list];
    const [img] = next.splice(from, 1);
    next.splice(i, 0, img);
    setList(next);
  }

  function addUrl() {
    if (!urlInput.trim()) return;
    setList([...list, urlInput.trim()]);
    setUrlInput('');
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragOver ? 'border-gold bg-gold/5' : 'border-border hover:border-gold/50'}`}
      >
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Glisse-dépose des photos ici, ou clique pour en choisir (plusieurs possibles)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {list.map((img, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => onThumbDragStart(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onThumbDrop(i)}
              className="relative group rounded-lg border border-border overflow-hidden bg-card"
            >
              <img src={img} alt="" className="w-full h-28 object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-gold text-navy text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Star className="h-3 w-3" /> Principale
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition">
                <div className="flex items-center gap-0.5">
                  <button type="button" title="Déplacer à gauche" onClick={() => move(i, -1)} className="text-white p-1 hover:bg-white/20 rounded"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-white/60 p-1"><GripVertical className="h-3.5 w-3.5" /></span>
                  <button type="button" title="Déplacer à droite" onClick={() => move(i, 1)} className="text-white p-1 hover:bg-white/20 rounded"><ChevronRight className="h-4 w-4" /></button>
                </div>
                <div className="flex items-center gap-0.5">
                  {i !== 0 && <button type="button" title="Définir comme principale" onClick={() => setAsMain(i)} className="text-white p-1 hover:bg-white/20 rounded"><Star className="h-4 w-4" /></button>}
                  <button type="button" title="Supprimer" onClick={() => removeAt(i)} className="text-white p-1 hover:bg-white/20 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-center">
        <Input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          placeholder="…ou coller une URL d'image externe"
          className="text-sm"
        />
        <Button type="button" variant="outline" onClick={addUrl}>Ajouter</Button>
      </div>
    </div>
  );
}
