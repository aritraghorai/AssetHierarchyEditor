export class EntityType {
  type: string;
  Attributes: string;
  constructor(type: string, Attributes: string) {
    this.type = type;
    this.Attributes = Attributes;
  }
}

export type Action = "INSERT" | "DELETE";
export class TreeNode {
  id: string;
  name: string;
  entityType: EntityType;
  source: string;
  Attributes: string;
  action: Action;

  children: TreeNode[] = [];

  links: TreeNode[] = [];

  constructor(
    id: string,
    name: string,
    entityType: EntityType,
    source: string,
    Attributes: string,
    action: Action
  ) {
    this.id = id;
    this.name = name;
    this.entityType = entityType;
    this.source = source;
    this.Attributes = Attributes;
    this.action = action;
  }

  setAttributes(Attributes: string) {
    this.Attributes = Attributes;
  }
}
