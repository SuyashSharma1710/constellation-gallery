export class PhysicsWorld {
  private static instance: PhysicsWorld;

  static getInstance() {
    if (!PhysicsWorld.instance) {
      PhysicsWorld.instance = new PhysicsWorld();
    }
    return PhysicsWorld.instance;
  }
}