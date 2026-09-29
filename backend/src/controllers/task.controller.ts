import { Response, NextFunction } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares";
import { prisma } from "../config";

const selectTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, "Please select at least one task to continue"),
});

export class TaskController {
  /**
   * Returns all 6 categories with tasks, ordered by displayOrder
   */
  static async getCatalog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { displayOrder: "asc" },
        include: {
          tasks: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Saves the tasks chosen by the user
   */
  static async selectTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { taskIds } = selectTasksSchema.parse(req.body);
      const userId = req.user!.id;

      // Replace or merge user's tasks
      await prisma.$transaction(async (tx) => {
        // Clear previous selections for this user
        await tx.userTask.deleteMany({
          where: { userId },
        });

        // Insert new selected tasks
        const createData = taskIds.map((taskId) => ({
          userId,
          taskId,
        }));

        await tx.userTask.createMany({
          data: createData,
        });
      });

      const selected = await prisma.userTask.findMany({
        where: { userId },
        include: {
          task: {
            include: { category: true },
          },
        },
      });

      res.json({
        success: true,
        message: "Tasks saved successfully.",
        data: selected,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Returns user's saved tasks for the Home Screen
   */
  static async getMyTasks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const myTasks = await prisma.userTask.findMany({
        where: { userId },
        include: {
          task: {
            include: { category: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: myTasks.map((ut) => ({
          id: ut.task.id,
          name: ut.task.name,
          description: ut.task.description,
          categoryName: ut.task.category.name,
          categoryIcon: ut.task.category.icon,
          selectedAt: ut.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
}
