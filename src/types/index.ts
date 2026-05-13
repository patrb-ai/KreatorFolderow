export interface FolderNode {
  id: string;
  name: string;
  children: FolderNode[];
  isEditing?: boolean;
  isExpanded?: boolean;
}

export interface Template {
  id: string;
  name: string;
  folders: FolderNode[];
}
